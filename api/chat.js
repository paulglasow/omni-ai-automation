/**
 * api/chat.js
 *
 * Multi-model AI chat endpoint with:
 * - Model routing (assist / openai / claude / gemini / perplexity / all)
 * - Cost & usage reporting per request
 * - Optional workspace cost tracking via Supabase
 */

import { buildUsage, aggregateUsage } from '../lib/cost-calculator.js';
import { getSupabaseAdmin, extractJwt } from '../lib/supabase/server.js';
import { routeForQA, buildQASystemPrompt, buildQAUserMessage } from '../lib/qa-router.js';

const ENABLE_COST_ESTIMATES = process.env.ENABLE_COST_ESTIMATES !== 'false';

// ---------------------------------------------------------------------------
// Provider helpers
// ---------------------------------------------------------------------------

// Resolve API key: user-provided (BYOK) takes priority over server env var
function resolveKey(userKeys, provider, envVar) {
  const key = userKeys?.[provider] || process.env[envVar];
  if (!key) throw new Error(`${provider} API key not configured. Add your key in Settings.`);
  return key;
}

async function callOpenAI(messages, keys) {
  const apiKey = resolveKey(keys, 'openai', 'OPENAI_API_KEY');
  const { default: OpenAI } = await import('openai');
  const client = new OpenAI({ apiKey });
  const res = await client.chat.completions.create({
    model: 'gpt-4o',
    messages,
  });
  const choice = res.choices[0].message;
  return {
    content: choice.content,
    usage: buildUsage('gpt-4o', res.usage),
  };
}

async function callClaude(messages, keys) {
  const apiKey = resolveKey(keys, 'claude', 'ANTHROPIC_API_KEY');
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic({ apiKey });
  const systemMsg = messages.find((m) => m.role === 'system');
  const userMsgs = messages.filter((m) => m.role !== 'system');
  const res = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2048,
    system: systemMsg?.content,
    messages: userMsgs,
  });
  return {
    content: res.content[0].text,
    usage: buildUsage('claude', res.usage),
  };
}

async function callGemini(prompt, keys) {
  const apiKey = resolveKey(keys, 'gemini', 'GEMINI_API_KEY');
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
  const res = await model.generateContent(prompt);
  const text = res.response.text();
  const sdkUsage = res.response.usageMetadata ?? {};
  return {
    content: text,
    usage: buildUsage('gemini', {
      prompt_tokens: sdkUsage.promptTokenCount ?? 0,
      completion_tokens: sdkUsage.candidatesTokenCount ?? 0,
    }),
  };
}

async function callPerplexity(messages, keys) {
  const apiKey = keys?.perplexity || process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    // Fall back to GPT-4o if Perplexity key is absent
    return callOpenAI(messages, keys);
  }
  const res = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-sonar-large-128k-online',
      messages,
    }),
  });
  if (!res.ok) {
    throw new Error(`Perplexity API error: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  return {
    content: data.choices[0].message.content,
    usage: buildUsage('perplexity', data.usage ?? {}),
  };
}

// ---------------------------------------------------------------------------
// Routing heuristics for "assist" mode
// ---------------------------------------------------------------------------

const RESEARCH_KEYWORDS = [
  'what is', 'who is', 'latest', 'news', 'current', 'recent', 'search',
  'find', 'lookup', 'trends', 'statistics', 'data', 'report',
];
const CODE_KEYWORDS = [
  'code', 'function', 'debug', 'error', 'fix', 'implement', 'programming',
  'script', 'algorithm', 'class', 'refactor',
];
const GIS_KEYWORDS = [
  'map', 'gis', 'coordinates', 'spatial', 'shapefile', 'geojson', 'zoning',
  'parcel', 'lihtc', 'affordable housing', 'census', 'boundary',
];

function classifyPrompt(prompt) {
  const lower = prompt.toLowerCase();
  if (GIS_KEYWORDS.some((k) => lower.includes(k))) return 'gis';
  if (CODE_KEYWORDS.some((k) => lower.includes(k))) return 'code';
  if (RESEARCH_KEYWORDS.some((k) => lower.includes(k))) return 'research';
  return 'writing';
}

function bucketToProvider(bucket) {
  switch (bucket) {
    case 'gis':      return 'gemini';
    case 'code':     return 'claude';
    case 'research': return 'perplexity';
    default:         return 'openai';
  }
}

// ---------------------------------------------------------------------------
// Friendly error messages
// ---------------------------------------------------------------------------

function friendlyError(err) {
  if (err.message?.includes('API key')) return 'AI provider not configured. Please add the required API key.';
  if (err.message?.includes('429'))    return 'Rate limit reached. Please try again shortly.';
  if (err.message?.includes('500'))    return 'AI provider is temporarily unavailable.';
  return `Unexpected error: ${err.message}`;
}

// ---------------------------------------------------------------------------
// Cost logging to Supabase (best-effort, non-blocking)
// ---------------------------------------------------------------------------

async function logCostToSupabase({ userId, workspaceId, conversationId, model, routedTo, usageSummary }) {
  try {
    const db = getSupabaseAdmin();
    const record = {
      user_id: userId ?? null,
      workspace_id: workspaceId ?? null,
      conversation_id: conversationId ?? null,
      model,
      routed_to: routedTo ?? null,
      input_tokens: usageSummary.inputTokens ?? 0,
      output_tokens: usageSummary.outputTokens ?? 0,
      cost_usd: usageSummary.estimatedCostUsd ?? 0,
    };
    await db.from('usage_logs').insert(record);
  } catch {
    // Non-fatal: Supabase may not be configured in all environments
  }
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const {
    messages = [],
    prompt,
    model = 'assist',
    workspaceId,
    conversationId,
    files = [],
    apiKeys = {},
  } = req.body ?? {};

  // Guard against oversized request bodies (Vercel limit is 4.5MB)
  const bodySize = JSON.stringify(req.body).length;
  if (bodySize > 4_000_000) {
    return res.status(413).json({
      error: 'Request too large. Please reduce file sizes (max ~3MB total).',
    });
  }

  // Normalise input: accept either messages[] or a plain prompt string
  const chatMessages = messages.length
    ? messages
    : [{ role: 'user', content: String(prompt ?? '') }];

  const userPrompt = chatMessages.find((m) => m.role === 'user')?.content ?? '';

  // Build file context string if files are attached
  let fileContext = '';
  if (files.length > 0) {
    const fileTexts = [];
    for (const f of files) {
      let text = f.content;
      // Extract text from PDF files sent as base64
      if (f.encoding === 'base64' && f.type === 'application/pdf') {
        try {
          const pdfParse = (await import('pdf-parse')).default;
          const buffer = Buffer.from(f.content, 'base64');
          const pdf = await pdfParse(buffer);
          text = pdf.text;
        } catch (e) {
          text = `[Failed to extract PDF text: ${e.message}]`;
        }
      } else if (f.encoding === 'base64' && f.type?.startsWith('image/')) {
        // Image files: provide metadata for text-based providers
        text = `[Image file attached: ${f.name} (${f.type}). Image analysis available via Gemini.]`;
      }
      fileTexts.push(`--- File: ${f.name} (${f.type || 'text/plain'}) ---\n${text}`);
    }
    fileContext = fileTexts.join('\n\n');
    // Truncate to ~100K chars to stay within model context limits
    if (fileContext.length > 100_000) {
      fileContext = fileContext.slice(0, 100_000) + '\n\n[... content truncated due to size ...]';
    }
  }

  // Prepend file content to messages if files are attached
  const chatMessagesWithFiles = fileContext
    ? chatMessages.map((m, i) => {
        if (i === chatMessages.length - 1 && m.role === 'user') {
          return { ...m, content: `${fileContext}\n\n${m.content}` };
        }
        return m;
      })
    : chatMessages;

  const userPromptWithFiles = fileContext
    ? `${fileContext}\n\n${userPrompt}`
    : userPrompt;

  // Extract user identity from JWT (optional — best-effort)
  let userId = null;
  try {
    const jwt = extractJwt(req.headers.authorization);
    const { createClient } = await import('@supabase/supabase-js');
    const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    const { data: { user } } = await client.auth.getUser(jwt);
    userId = user?.id ?? null;
  } catch {
    // Unauthenticated requests are still served (public/anonymous usage)
  }

  try {
    let content, providerKey, bucket = null, routedTo = null;
    let providerUsage = {};

    if (model === 'qa') {
      // -----------------------------------------------------------------------
      // QA/QC Chain: Primary analysis -> Secondary QA review -> Combined output
      // -----------------------------------------------------------------------
      const routing = routeForQA(userPrompt, files);
      bucket = routing.bucket;

      // Step 1: Primary analysis
      const primaryResult = await dispatch(
        routing.primary,
        chatMessagesWithFiles,
        userPromptWithFiles,
        apiKeys
      );
      providerUsage[routing.primary] = primaryResult.usage;

      // Step 2: QA review by secondary provider
      const qaSystemPrompt = buildQASystemPrompt(routing.primary);
      const qaUserMessage = buildQAUserMessage(
        userPrompt,
        primaryResult.content,
        routing.primary,
        fileContext || null
      );
      const qaMessages = [
        { role: 'system', content: qaSystemPrompt },
        { role: 'user', content: qaUserMessage },
      ];
      const qaResult = await dispatch(
        routing.secondary,
        qaMessages,
        qaUserMessage,
        apiKeys
      );
      providerUsage[routing.secondary] = qaResult.usage;

      // Build cost summary across both calls
      const costSummary = buildCostSummary(providerUsage);

      // Log both calls to Supabase
      void logCostToSupabase({
        userId, workspaceId, conversationId,
        model: 'qa', routedTo: routing.primary,
        usageSummary: primaryResult.usage,
      });
      void logCostToSupabase({
        userId, workspaceId, conversationId,
        model: 'qa', routedTo: routing.secondary,
        usageSummary: qaResult.usage,
      });

      return res.status(200).json({
        model: 'qa',
        primary: {
          provider: routing.primary,
          content: primaryResult.content,
          usage: primaryResult.usage,
        },
        qa: {
          provider: routing.secondary,
          content: qaResult.content,
          usage: qaResult.usage,
        },
        bucket: routing.bucket,
        routingScores: routing.scores,
        ...(ENABLE_COST_ESTIMATES ? { usage: costSummary } : {}),
      });
    } else if (model === 'assist') {
      bucket = classifyPrompt(userPrompt);
      routedTo = bucketToProvider(bucket);
      const result = await dispatch(routedTo, chatMessagesWithFiles, userPromptWithFiles, apiKeys);
      content = result.content;
      providerUsage[routedTo] = result.usage;
      providerKey = 'assist';
    } else if (model === 'all') {
      const results = await Promise.allSettled([
        callOpenAI(chatMessagesWithFiles, apiKeys).then((r) => ({ provider: 'openai', ...r })),
        callClaude(chatMessagesWithFiles, apiKeys).then((r) => ({ provider: 'claude', ...r })),
        callGemini(userPromptWithFiles, apiKeys).then((r) => ({ provider: 'gemini', ...r })),
        callPerplexity(chatMessagesWithFiles, apiKeys).then((r) => ({ provider: 'perplexity', ...r })),
      ]);

      const responses = {};
      for (const result of results) {
        if (result.status === 'fulfilled') {
          const { provider, content: c, usage } = result.value;
          responses[provider] = c;
          providerUsage[provider] = usage;
        } else {
          responses[result.reason?.provider ?? 'unknown'] = friendlyError(result.reason);
        }
      }

      return res.status(200).json({
        model: 'all',
        responses,
        ...(ENABLE_COST_ESTIMATES ? { usage: buildCostSummary(providerUsage) } : {}),
      });
    } else {
      const result = await dispatch(model, chatMessagesWithFiles, userPromptWithFiles, apiKeys);
      content = result.content;
      providerUsage[model] = result.usage;
      providerKey = model;
      routedTo = model;
    }

    // Aggregate cost across all providers used
    const costSummary = buildCostSummary(providerUsage);

    // Best-effort log to Supabase
    const primaryProvider = Object.keys(providerUsage)[0];
    const primaryUsage = providerUsage[primaryProvider] ?? {};
    void logCostToSupabase({
      userId,
      workspaceId,
      conversationId,
      model: providerKey,
      routedTo,
      usageSummary: primaryUsage,
    });

    return res.status(200).json({
      content,
      model: providerKey,
      ...(routedTo && routedTo !== providerKey ? { routedTo } : {}),
      ...(bucket ? { bucket } : {}),
      ...(ENABLE_COST_ESTIMATES ? { usage: costSummary } : {}),
    });
  } catch (err) {
    console.error('[chat] Error:', err);
    return res.status(500).json({ error: friendlyError(err) });
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function dispatch(provider, messages, prompt, keys) {
  switch (provider) {
    case 'openai':     return callOpenAI(messages, keys);
    case 'claude':     return callClaude(messages, keys);
    case 'gemini':     return callGemini(prompt, keys);
    case 'perplexity': return callPerplexity(messages, keys);
    default:           throw new Error(`Unknown provider: ${provider}`);
  }
}

function buildCostSummary(providerUsage) {
  const total = aggregateUsage(providerUsage);
  return { ...providerUsage, total };
}
