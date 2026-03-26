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

const ENABLE_COST_ESTIMATES = process.env.ENABLE_COST_ESTIMATES !== 'false';

// ---------------------------------------------------------------------------
// Provider helpers
// ---------------------------------------------------------------------------

async function callOpenAI(messages) {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set');
  const { default: OpenAI } = await import('openai');
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
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

async function callClaude(messages) {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not set');
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
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

async function callGemini(prompt) {
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not set');
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
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

async function callPerplexity(messages) {
  if (!process.env.PERPLEXITY_API_KEY) {
    // Fall back to GPT-4o if Perplexity key is absent
    return callOpenAI(messages);
  }
  const res = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
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
  } = req.body ?? {};

  // Normalise input: accept either messages[] or a plain prompt string
  const chatMessages = messages.length
    ? messages
    : [{ role: 'user', content: String(prompt ?? '') }];

  const userPrompt = chatMessages.find((m) => m.role === 'user')?.content ?? '';

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

    if (model === 'assist') {
      bucket = classifyPrompt(userPrompt);
      routedTo = bucketToProvider(bucket);
      const result = await dispatch(routedTo, chatMessages, userPrompt);
      content = result.content;
      providerUsage[routedTo] = result.usage;
      providerKey = 'assist';
    } else if (model === 'all') {
      const results = await Promise.allSettled([
        callOpenAI(chatMessages).then((r) => ({ provider: 'openai', ...r })),
        callClaude(chatMessages).then((r) => ({ provider: 'claude', ...r })),
        callGemini(userPrompt).then((r) => ({ provider: 'gemini', ...r })),
        callPerplexity(chatMessages).then((r) => ({ provider: 'perplexity', ...r })),
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
      const result = await dispatch(model, chatMessages, userPrompt);
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

async function dispatch(provider, messages, prompt) {
  switch (provider) {
    case 'openai':     return callOpenAI(messages);
    case 'claude':     return callClaude(messages);
    case 'gemini':     return callGemini(prompt);
    case 'perplexity': return callPerplexity(messages);
    default:           throw new Error(`Unknown provider: ${provider}`);
  }
}

function buildCostSummary(providerUsage) {
  const total = aggregateUsage(providerUsage);
  return { ...providerUsage, total };
}
