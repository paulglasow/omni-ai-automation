/**
 * Smart routing logic for Assist and Auto modes.
 * Preserved from the original api/chat.js routing heuristics.
 */

import * as claude from './claude.js';
import * as openai from './openai.js';
import * as gemini from './gemini.js';
import * as perplexity from './perplexity.js';
import { aggregateUsage } from '../cost-calculator.js';

// ---------------------------------------------------------------------------
// Keyword-based classification
// ---------------------------------------------------------------------------

const RESEARCH_KEYWORDS = [
  'latest', 'recent', 'today', 'current', 'up to date', 'news', 'research',
  'sources', 'recent developments', 'what changed', 'look up', 'investigate',
  'compare sources', 'market update', 'trend', 'trends', 'recent research',
  'summarize recent', 'what is', 'who is', 'search', 'find', 'lookup',
  'statistics', 'data', 'report',
];

const CODE_KEYWORDS = [
  'code', 'function', 'debug', 'error', 'fix', 'implement', 'programming',
  'script', 'algorithm', 'class', 'refactor', 'coding', 'repo', 'pull request',
  'tests', 'ui', 'frontend', 'backend',
];

const WRITING_KEYWORDS = [
  'write', 'draft', 'memo', 'letter', 'essay', 'synthesis', 'document',
  'analysis', 'strategy', 'thoughtful', 'reasoning', 'summarize',
];

const GIS_KEYWORDS = [
  'map', 'gis', 'coordinates', 'spatial', 'shapefile', 'geojson', 'zoning',
  'parcel', 'lihtc', 'affordable housing', 'census', 'boundary',
  'structured analysis', 'tabular', 'math', 'spreadsheet', 'data oriented',
];

function classifyPrompt(prompt) {
  const lower = prompt.toLowerCase();
  if (GIS_KEYWORDS.some((k) => lower.includes(k))) return 'gis';
  if (RESEARCH_KEYWORDS.some((k) => lower.includes(k))) return 'research';
  if (CODE_KEYWORDS.some((k) => lower.includes(k))) return 'code';
  if (WRITING_KEYWORDS.some((k) => lower.includes(k))) return 'writing';
  return 'general';
}

function bucketToProvider(bucket) {
  switch (bucket) {
    case 'gis': return 'gemini';
    case 'research': return 'perplexity';
    case 'code': return 'openai';
    case 'writing': return 'openai';
    default: return 'openai';        // Default to GPT-4o
  }
}

// ---------------------------------------------------------------------------
// Provider dispatch
// ---------------------------------------------------------------------------

const PROVIDERS = { openai, claude, gemini, perplexity };

async function dispatch(provider, messages) {
  const mod = PROVIDERS[provider];
  if (!mod) throw new Error(`Unknown provider: ${provider}`);
  return mod.call(messages);
}

// ---------------------------------------------------------------------------
// Assist mode — smart routing with optional Perplexity research + synthesis
// ---------------------------------------------------------------------------

async function handleAssist(messages, userPrompt) {
  const bucket = classifyPrompt(userPrompt);
  let preferredProvider = bucketToProvider(bucket);
  const usedModels = [];
  let fallbackReason = null;

  // If research bucket but Perplexity not configured, fall back
  if (preferredProvider === 'perplexity' && !perplexity.isConfigured()) {
    preferredProvider = claude.isConfigured() ? 'claude' : 'openai';
    fallbackReason = 'Perplexity not configured — used ' + preferredProvider + ' instead';
  }

  // If preferred provider is not configured, find one that is
  if (!PROVIDERS[preferredProvider]?.isConfigured()) {
    const fallbackOrder = ['claude', 'gemini', 'perplexity', 'openai'];
    const available = fallbackOrder.find((name) => PROVIDERS[name]?.isConfigured());
    if (!available) throw new Error('No AI providers configured. Add at least one API key to .env.local');
    fallbackReason = `${preferredProvider} not configured — used ${available} instead`;
    preferredProvider = available;
  }

  const result = await dispatch(preferredProvider, messages);
  usedModels.push(preferredProvider);

  return {
    content: result.content,
    model: 'assist',
    routedTo: preferredProvider,
    bucket,
    usedModels,
    fallbackReason,
    usage: { [preferredProvider]: result.usage, total: aggregateUsage({ [preferredProvider]: result.usage }) },
  };
}

// ---------------------------------------------------------------------------
// All mode — call every configured provider in parallel
// ---------------------------------------------------------------------------

async function handleAll(messages) {
  const calls = Object.entries(PROVIDERS).map(async ([name, mod]) => {
    if (!mod.isConfigured()) return { provider: name, content: `[${name} not configured]`, usage: null };
    try {
      const result = await mod.call(messages);
      return { provider: name, content: result.content, usage: result.usage };
    } catch (err) {
      return { provider: name, content: `[Error: ${err.message}]`, usage: null };
    }
  });

  const results = await Promise.all(calls);
  const responses = {};
  const providerUsage = {};

  for (const r of results) {
    responses[r.provider] = r.content;
    if (r.usage) providerUsage[r.provider] = r.usage;
  }

  return {
    model: 'all',
    responses,
    usage: { ...providerUsage, total: aggregateUsage(providerUsage) },
  };
}

// ---------------------------------------------------------------------------
// Main router export
// ---------------------------------------------------------------------------

export async function route(messages, model) {
  const userPrompt = messages.filter((m) => m.role === 'user').map((m) => m.content).join(' ');

  if (model === 'assist' || model === 'auto') {
    return handleAssist(messages, userPrompt);
  }

  if (model === 'all') {
    return handleAll(messages);
  }

  // Direct provider selection
  const providerName = model === 'gpt-4o' ? 'openai' : model;
  if (!PROVIDERS[providerName]) {
    throw new Error(`Unknown model: ${model}. Choose from: assist, openai, claude, gemini, perplexity, all`);
  }
  if (!PROVIDERS[providerName].isConfigured()) {
    throw new Error(`${providerName} is not configured. Add its API key to your .env.local file.`);
  }

  const result = await dispatch(providerName, messages);
  return {
    content: result.content,
    model: providerName,
    routedTo: providerName,
    usedModels: [providerName],
    usage: { [providerName]: result.usage, total: aggregateUsage({ [providerName]: result.usage }) },
  };
}
