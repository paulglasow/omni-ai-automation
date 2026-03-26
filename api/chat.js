// api/chat.js — Vercel serverless function
// Routes chat messages to the correct AI provider.
//
// POST /api/chat
//   Body: { message: string, model: string, history?: {role,content}[] }
//   Response (single AI): { content: string, model: string }
//   Response (all AIs):    { responses: { [model]: string } }
//
// Supported model values:
//   "auto"        → route to best AI for the query type
//   "gpt-4o"      → OpenAI GPT-4o (general reasoning, code, creativity)
//   "claude"      → Anthropic Claude 3.5 Sonnet (long docs, nuanced analysis)
//   "gemini"      → Google Gemini 1.5 Pro (multimodal, data/math)
//   "perplexity"  → Perplexity sonar-pro (web-search-augmented, real-time data)
//   "all"         → query all four AIs and return combined responses

'use strict';

const MAX_TOKENS = 1024;

// ── AI Clients ──────────────────────────────────────────────────────────────

/**
 * Call OpenAI GPT-4o.
 * Strengths: creative writing, code generation, structured output,
 *            broad general knowledge.
 */
async function callOpenAI(message, history) {
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
 * Strengths: 200k-token context window, nuanced instruction-following,
 *            deep document analysis.
 */
async function callClaude(message, history) {
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
 * Strengths: multimodal reasoning (text + images/video), data/math tasks,
 *            Google ecosystem integration.
 */
async function callGemini(message, history) {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

  // Convert history to Gemini format
  const geminiHistory = history.map(m => ({
    role:  m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const chat     = model.startChat({ history: geminiHistory });
  const result   = await chat.sendMessage(message);
  return result.response.text();
}

/**
 * Call Perplexity sonar-pro via the OpenAI-compatible endpoint.
 *
 * UNIQUE CONTRIBUTION — What Perplexity adds that the other three AIs cannot:
 *   • Real-time web search: answers grounded in live internet data, not a
 *     frozen training cut-off.
 *   • Inline citations: every factual claim is linked back to a source URL.
 *   • Breaking news / current events: stock prices, today's headlines,
 *     recent product releases, up-to-the-minute research papers.
 *
 * NOT duplicative of OpenAI / Claude / Gemini because those models use
 * static training knowledge. Perplexity is the only provider here that
 * actively searches the web at query time.
 */
async function callPerplexity(message, history) {
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

// ── Auto-routing logic ───────────────────────────────────────────────────────

/**
 * Decide which AI is best suited for a message.
 *
 * Routing rules (in priority order):
 *   1. News / current events / real-time → Perplexity  (web-search augmented)
 *   2. Long documents / deep analysis    → Claude       (200k context window)
 *   3. Code / math / structured output   → OpenAI GPT-4o
 *   4. Multimodal / data / research      → Gemini
 *   5. Everything else                   → OpenAI GPT-4o (strong default)
 */
function chooseModel(message) {
  const lower = message.toLowerCase();

  const realtimeKeywords = [
    'latest', 'current', 'today', 'now', 'recent', 'news', 'update',
    'price', 'stock', 'weather', 'score', 'live', 'breaking',
  ];
  if (realtimeKeywords.some(kw => lower.includes(kw))) {
    return 'perplexity';
  }

  const longDocKeywords = [
    'document', 'pdf', 'report', 'essay', 'book', 'transcript',
    'analyse', 'analyze', 'summarize', 'summarise', 'review this',
  ];
  if (longDocKeywords.some(kw => lower.includes(kw))) {
    return 'claude';
  }

  const codeKeywords = [
    'code', 'function', 'script', 'debug', 'error', 'syntax',
    'implement', 'refactor', 'test', 'bug',
  ];
  if (codeKeywords.some(kw => lower.includes(kw))) {
    return 'gpt-4o';
  }

  const dataKeywords = [
    'chart', 'graph', 'data', 'math', 'calculate', 'formula',
    'equation', 'statistics', 'image', 'photo',
  ];
  if (dataKeywords.some(kw => lower.includes(kw))) {
    return 'gemini';
  }

  return 'gpt-4o';
}

// ── Route handler ────────────────────────────────────────────────────────────

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
    if (model === 'all') {
      // Query all 4 AIs in parallel and return combined responses
      const [gpt, claude, gemini, perplexity] = await Promise.allSettled([
        callOpenAI(trimmed, history),
        callClaude(trimmed, history),
        callGemini(trimmed, history),
        callPerplexity(trimmed, history),
      ]);

      return res.status(200).json({
        responses: {
          'gpt-4o':     gpt.status      === 'fulfilled' ? gpt.value      : `Error: ${gpt.reason?.message}`,
          'claude':     claude.status   === 'fulfilled' ? claude.value   : `Error: ${claude.reason?.message}`,
          'gemini':     gemini.status   === 'fulfilled' ? gemini.value   : `Error: ${gemini.reason?.message}`,
          'perplexity': perplexity.status === 'fulfilled' ? perplexity.value : `Error: ${perplexity.reason?.message}`,
        },
      });
    }

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
    console.error('[api/chat] Error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
};
