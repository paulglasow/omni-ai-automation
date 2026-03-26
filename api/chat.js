// api/chat.js — Vercel serverless function
// Routes chat messages to the correct AI provider.
//
// POST /api/chat
//   Body: { message: string, model: string, history?: {role,content}[] }
//   Response (single AI): { content: string, model: string }
//   Response (assist):    { content: string, model: 'assist', routedTo: string }
//   Response (all AIs):   { responses: { [model]: string } }
//
// Supported model values:
//   "auto"        → route to best AI for the query type
//   "assist"      → classify query and route to optimal model for GIS/housing tasks
//   "gpt-4o"      → OpenAI GPT-4o (general reasoning, agentic workflows, orchestration)
//   "claude"      → Anthropic Claude 3.5 Sonnet (GIS scripting, long docs, grant drafts)
//   "gemini"      → Google Gemini 1.5 Pro (imagery/PDF/map analysis, data/math)
//   "perplexity"  → Perplexity sonar-pro (real-time research: zoning, funding, news)
//   "all"         → query all four AIs and return combined responses

'use strict';

const MAX_TOKENS = 1024;

// ── API Key Guards ────────────────────────────────────────────────────────────

function requireOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      'OpenAI is not configured. Add OPENAI_API_KEY in your environment.'
    );
  }
}

function requireAnthropic() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      'Anthropic (Claude) is not configured. Add ANTHROPIC_API_KEY in your environment.'
    );
  }
}

function requireGemini() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      'Google Gemini is not configured. Add GEMINI_API_KEY in your environment.'
    );
  }
}

function requirePerplexity() {
  if (!process.env.PERPLEXITY_API_KEY) {
    throw new Error(
      'Perplexity is not configured. Add PERPLEXITY_API_KEY in your environment to enable real-time research.'
    );
  }
}

// ── AI Clients ────────────────────────────────────────────────────────────────

/**
 * Call OpenAI GPT-4o.
 * Strengths: agentic workflows, multi-step tasks, drafting memos, general reasoning,
 *            orchestration, code generation, structured output, broad general knowledge.
 */
async function callOpenAI(message, history) {
  requireOpenAI();
  const { OpenAI } = require('openai');
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await client.chat.completions.create({
    model:    'gpt-4o',
    messages: [
      ...history,
      { role: 'user', content: message },
    ],
    max_tokens: MAX_TOKENS,
  });

  return response.choices[0].message.content;
}

/**
 * Call Anthropic Claude 3.5 Sonnet.
 * Strengths: Python GIS scripting (ArcGIS/QGIS), writing and debugging complex code,
 *            200k-token context window, long planning docs, grant drafts, nuanced
 *            instruction-following, deep document analysis.
 */
async function callClaude(message, history) {
  requireAnthropic();
  const Anthropic = require('@anthropic-ai/sdk');
  const client    = new Anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model:      'claude-3-5-sonnet-20241022',
    max_tokens: MAX_TOKENS,
    messages:   [
      ...history,
      { role: 'user', content: message },
    ],
  });

  return response.content[0].text;
}

/**
 * Call Google Gemini 1.5 Pro.
 * Strengths: GIS/media analysis (site imagery, PDFs, maps), data/math tasks,
 *            multimodal reasoning (text + images/video), Google Workspace integration.
 */
async function callGemini(message, history) {
  requireGemini();
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

  // Convert history to Gemini format
  const geminiHistory = history.map(m => ({
    role:  m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const chat   = model.startChat({ history: geminiHistory });
  const result = await chat.sendMessage(message);
  return result.response.text();
}

/**
 * Call Perplexity sonar-pro via the OpenAI-compatible endpoint.
 *
 * UNIQUE CONTRIBUTION — What Perplexity adds that the other three AIs cannot:
 *   • Real-time web search: answers grounded in live internet data, not a
 *     frozen training cut-off.
 *   • Inline citations: every factual claim is linked back to a source URL.
 *   • Breaking news / current events: zoning changes, funding opportunities,
 *     LIHTC allocation updates, market trends.
 *
 * NOT duplicative of OpenAI / Claude / Gemini because those models use
 * static training knowledge. Perplexity is the only provider here that
 * actively searches the web at query time.
 *
 * OPTIONAL: this provider is recommended but not required. Core OmniAI
 * functions (coding, analysis, writing) work without it.
 */
async function callPerplexity(message, history) {
  requirePerplexity();
  const { OpenAI } = require('openai');

  // Perplexity exposes an OpenAI-compatible chat endpoint.
  const client = new OpenAI({
    apiKey:  process.env.PERPLEXITY_API_KEY,
    baseURL: 'https://api.perplexity.ai',
  });

  const response = await client.chat.completions.create({
    model:    'sonar-pro',
    messages: [
      {
        role:    'system',
        content: 'Be precise and concise. Always cite your sources with URLs.',
      },
      ...history,
      { role: 'user', content: message },
    ],
    max_tokens: MAX_TOKENS,
  });

  let content = response.choices[0].message.content;

  // Append citation URLs if the API returned them
  const citations = response.citations;
  if (Array.isArray(citations) && citations.length > 0) {
    const links = citations.map((url, i) => `[${i + 1}] ${url}`).join('\n');
    content += `\n\n**Sources:**\n${links}`;
  }

  return content;
}

// ── Routing Logic ─────────────────────────────────────────────────────────────

/**
 * Keywords indicating real-time research needs.
 * Biased toward GIS + affordable housing domain terms.
 */
const RESEARCH_KEYWORDS = [
  // Generic freshness signals
  'latest', 'current', 'today', 'now', 'recent', 'news', 'update',
  'price', 'stock', 'weather', 'score', 'live', 'breaking',
  // Research / source-finding
  'find sources', 'look up', 'investigate', 'recent developments', 'trends',
  'what changed', 'industry report', 'market report', 'overview of',
  // GIS + housing domain
  'zoning update', 'zoning change', 'zoning code', 'zoning law',
  'funding opportunity', 'funding update', 'grant opportunity',
  'lihtc update', 'lihtc allocation', 'lihtc rules', 'tax credit update',
  'hud update', 'affordable housing policy', 'housing policy',
  'regulation change', 'regulatory update', 'permitting update',
  'market news', 'neighborhood data', 'demographic update',
];

/**
 * Keywords for coding and scripting tasks (routes to Claude for GIS scripts,
 * GPT-4o for general code).
 */
const CODE_KEYWORDS = [
  'code', 'function', 'script', 'debug', 'error', 'syntax',
  'implement', 'refactor', 'test', 'bug', 'python', 'arcgis', 'qgis',
  'geopandas', 'shapefile', 'raster', 'vector', 'gdal', 'api call',
  'automate', 'automation',
];

/**
 * Keywords for GIS / imagery / data / math tasks (routes to Gemini).
 */
const GIS_DATA_KEYWORDS = [
  'chart', 'graph', 'data', 'math', 'calculate', 'formula',
  'equation', 'statistics', 'image', 'photo', 'map', 'aerial',
  'satellite', 'imagery', 'pdf', 'parcel', 'site plan', 'floor plan',
  'massing', 'feasibility', 'density', 'setback', 'floor area ratio',
  'far', 'gis analysis', 'spatial', 'coordinates', 'shapefile',
];

/**
 * Keywords for long-document / deep-analysis tasks (routes to Claude).
 */
const LONG_DOC_KEYWORDS = [
  'document', 'pdf', 'report', 'essay', 'book', 'transcript',
  'analyse', 'analyze', 'summarize', 'summarise', 'review this',
  'planning document', 'grant', 'grant draft', 'grant proposal',
  'developer agreement', 'loan agreement', 'partnership agreement',
  'waterfall', 'proforma', 'pro forma', 'lihtc application',
];

/**
 * Decide which AI is best suited for a message.
 *
 * Priority order:
 *   1. Real-time / research keywords → Perplexity (if configured)
 *   2. Long documents / grant drafts → Claude
 *   3. Python GIS scripting, debugging → Claude
 *   4. GIS/data/imagery analysis → Gemini
 *   5. Everything else (agentic, writing, orchestration) → GPT-4o
 */
function chooseModel(message) {
  const lower = message.toLowerCase();

  if (RESEARCH_KEYWORDS.some(kw => lower.includes(kw))) {
    // Fall back gracefully when Perplexity key is absent
    return process.env.PERPLEXITY_API_KEY ? 'perplexity' : 'gpt-4o';
  }

  if (LONG_DOC_KEYWORDS.some(kw => lower.includes(kw))) {
    return 'claude';
  }

  if (CODE_KEYWORDS.some(kw => lower.includes(kw))) {
    return 'claude';
  }

  if (GIS_DATA_KEYWORDS.some(kw => lower.includes(kw))) {
    return 'gemini';
  }

  return 'gpt-4o';
}

/**
 * Classify a query into a task bucket for the `assist` mode.
 * Returns the recommended provider key.
 *
 * Buckets:
 *   research   → Perplexity  (real-time zoning/funding/market data)
 *   coding     → Claude      (Python GIS scripts, ArcGIS/QGIS, debugging)
 *   gis-data   → Gemini      (site imagery, PDFs, maps, math/data tasks)
 *   long-doc   → Claude      (planning docs, grant proposals, LIHTC apps)
 *   writing    → GPT-4o      (memos, emails, agentic multi-step workflows)
 */
function classifyQuery(message) {
  const lower = message.toLowerCase();

  if (RESEARCH_KEYWORDS.some(kw => lower.includes(kw))) {
    return { bucket: 'research', provider: process.env.PERPLEXITY_API_KEY ? 'perplexity' : 'gpt-4o' };
  }

  if (LONG_DOC_KEYWORDS.some(kw => lower.includes(kw))) {
    return { bucket: 'long-doc', provider: 'claude' };
  }

  if (CODE_KEYWORDS.some(kw => lower.includes(kw))) {
    return { bucket: 'coding', provider: 'claude' };
  }

  if (GIS_DATA_KEYWORDS.some(kw => lower.includes(kw))) {
    return { bucket: 'gis-data', provider: 'gemini' };
  }

  return { bucket: 'writing', provider: 'gpt-4o' };
}

/**
 * Dispatch to the correct provider function by key.
 */
async function callProvider(provider, message, history) {
  switch (provider) {
    case 'gpt-4o':     return callOpenAI(message, history);
    case 'claude':     return callClaude(message, history);
    case 'gemini':     return callGemini(message, history);
    case 'perplexity': return callPerplexity(message, history);
    default: throw new Error(`Unknown provider: ${provider}`);
  }
}

// ── Friendly Error Messages ───────────────────────────────────────────────────

function friendlyError(provider, reason) {
  const messages = {
    'gpt-4o':     '⚠️ OpenAI unavailable. Check your OPENAI_API_KEY in Settings.',
    'claude':     '⚠️ Anthropic (Claude) unavailable. Check your ANTHROPIC_API_KEY in Settings.',
    'gemini':     '⚠️ Google Gemini unavailable. Check your GEMINI_API_KEY in Settings.',
    'perplexity': '⚠️ Perplexity unavailable. Check your PERPLEXITY_API_KEY in Settings.',
  };
  return messages[provider] || `⚠️ ${provider} unavailable.`;
}

// ── Route Handler ─────────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, model = 'auto', history = [] } = req.body || {};

  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({ error: 'message is required' });
  }

  const trimmed = message.trim();

  try {
    // ── All-4-AIs mode ──────────────────────────────────────────────────────
    if (model === 'all') {
      const [gpt, claude, gemini, perplexity] = await Promise.allSettled([
        callOpenAI(trimmed, history),
        callClaude(trimmed, history),
        callGemini(trimmed, history),
        callPerplexity(trimmed, history),
      ]);

      return res.status(200).json({
        responses: {
          'gpt-4o':     gpt.status      === 'fulfilled' ? gpt.value      : friendlyError('gpt-4o'),
          'claude':     claude.status   === 'fulfilled' ? claude.value   : friendlyError('claude'),
          'gemini':     gemini.status   === 'fulfilled' ? gemini.value   : friendlyError('gemini'),
          'perplexity': perplexity.status === 'fulfilled' ? perplexity.value : friendlyError('perplexity'),
        },
      });
    }

    // ── Assist mode ─────────────────────────────────────────────────────────
    // Classifies the query into a task bucket (research / coding / gis-data /
    // long-doc / writing) and routes to the optimal AI for a 2026 GIS +
    // affordable housing developer workflow.
    if (model === 'assist') {
      const { bucket, provider } = classifyQuery(trimmed);
      const content = await callProvider(provider, trimmed, history);
      return res.status(200).json({
        content,
        model:    'assist',
        routedTo: provider,
        bucket,
      });
    }

    // ── Auto / explicit model mode ──────────────────────────────────────────
    const resolvedModel = model === 'auto' ? chooseModel(trimmed) : model;

    let content;
    switch (resolvedModel) {
      case 'gpt-4o':
        content = await callOpenAI(trimmed, history);
        break;
      case 'claude':
        content = await callClaude(trimmed, history);
        break;
      case 'gemini':
        content = await callGemini(trimmed, history);
        break;
      case 'perplexity':
        content = await callPerplexity(trimmed, history);
        break;
      default:
        return res.status(400).json({ error: `Unknown model: ${resolvedModel}` });
    }

    return res.status(200).json({ content, model: resolvedModel });
  } catch (err) {
    console.error('[api/chat] Error:', err.message);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
};
