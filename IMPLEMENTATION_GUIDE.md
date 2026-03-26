# OmniAI v4 — Implementation Guide

This guide walks through setting up OmniAI v4, a multi-model AI assistant
optimized for a 2026 GIS + affordable housing developer workflow.

---

## What Is OmniAI v4?

OmniAI v4 is a self-hosted, multi-model AI chat interface that connects
GPT-4o, Claude 3.5, Gemini 1.5 Pro, and Perplexity into a single interface.
Instead of manually switching between browser tabs, OmniAI routes each task
to the right AI automatically using its **Assist** mode.

**Core use cases for this stack:**
- Write and debug Python scripts for ArcGIS and QGIS (Claude)
- Research current zoning codes, LIHTC allocation rules, and funding news (Perplexity)
- Analyze site imagery, PDFs, and maps (Gemini)
- Draft memos, emails, grant proposals, and investor updates (GPT-4o / Claude)

For a deeper explanation of why each AI is best for specific tasks, see
[guides/gis-housing-ai-stack.md](guides/gis-housing-ai-stack.md).

---

## Prerequisites

- Node.js 18 or later
- A Vercel account (free tier is fine)
- API keys for the AI providers you want to use (see Section 2)

---

## Section 1 — Quick Start

```bash
# Clone and install
git clone https://github.com/paulglasow/omni-ai-automation
cd omni-ai-automation
npm install

# Copy the environment template and fill in your keys
cp .env.example .env
# Edit .env with your real API keys

# Validate your keys
node config/setup-ai-keys.js

# Deploy to Vercel
npm run deploy
```

---

## Section 2 — Getting Your API Keys

### Required Keys (core OmniAI features)

All three required keys are needed for full coding, analysis, and writing
functionality. If any are missing, the corresponding AI will return a clear
error message rather than crashing silently.

#### OpenAI (GPT-4o) — General workflows and agentic tasks
1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Click **Create new secret key**
3. Copy the key — it starts with `sk-proj-` or `sk-`
4. Add to `.env`: `OPENAI_API_KEY=sk-proj-...`

#### Anthropic (Claude 3.5) — GIS scripting, long docs, grant writing
1. Go to [console.anthropic.com/keys](https://console.anthropic.com/keys)
2. Click **Create Key**
3. Copy the key — it starts with `sk-ant-`
4. Add to `.env`: `ANTHROPIC_API_KEY=sk-ant-...`

#### Google Gemini 1.5 Pro — Site imagery, PDFs, data/math tasks
1. Go to [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. Click **Create API key**
3. Copy the key — it starts with `AIzaSy`
4. Add to `.env`: `GEMINI_API_KEY=AIzaSy...`

---

### Optional Key (real-time research)

#### Perplexity — Zoning updates, funding news, live web search ⭐ Optional
1. Go to [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)
2. Click **Generate** under API Keys
3. Copy the key — it starts with `pplx-`
4. Add to `.env`: `PERPLEXITY_API_KEY=pplx-...`

**What happens if you skip Perplexity?**
- Assist mode still works — research queries fall back to GPT-4o
- You won't get live web citations for zoning or funding questions
- You can add this key later by re-running `./install.sh --reconfigure-keys`
- Everything else (coding, analysis, writing) is unaffected

---

## Section 3 — AI Model Routing

OmniAI supports six model options in the chat interface:

| Option | What it does |
|---|---|
| **Assist (Smart Stack)** | Classifies your query and routes to the best AI automatically |
| **Auto (Best AI)** | Keyword-based routing (similar to Assist, no task classification) |
| **ChatGPT** | Always uses GPT-4o |
| **Claude** | Always uses Claude 3.5 Sonnet |
| **Gemini** | Always uses Gemini 1.5 Pro |
| **Perplexity** | Always uses Perplexity sonar-pro (requires key) |
| **All 4 AIs** | Queries all four providers and shows all responses |

**Recommended default:** Use **Assist** for everyday work. Override to a specific
model when you know exactly which AI you need.

---

## Section 4 — API Endpoint

The Vercel serverless function at `/api/chat` accepts POST requests:

```json
{
  "message": "Your question here",
  "model": "assist",
  "history": []
}
```

Supported `model` values: `assist`, `auto`, `gpt-4o`, `claude`, `gemini`,
`perplexity`, `all`.

**Assist mode response:**
```json
{
  "content": "The AI response text",
  "model": "assist",
  "routedTo": "perplexity",
  "bucket": "research"
}
```

The `routedTo` field tells the UI which provider handled the request so it
can display "Assist → Perplexity" above the response.

---

## Section 5 — Deployment

OmniAI deploys to Vercel as a static React app with serverless API functions.

```bash
npm run build   # Build the React app
npm run deploy  # Deploy to Vercel
```

All API keys must be added as **Vercel environment variables** (not committed
to your repo). Run `vercel env add OPENAI_API_KEY` for each key, or configure
them in the Vercel dashboard under **Settings → Environment Variables**.

---

## Section 6 — All Keys Checklist

Use this before going live to confirm everything is configured:

**Required — needed for core OmniAI:**
- [ ] `OPENAI_API_KEY` = `sk-proj-...`
- [ ] `ANTHROPIC_API_KEY` = `sk-ant-...`
- [ ] `GEMINI_API_KEY` = `AIzaSy...`

**Optional — enables real-time research:**
- [ ] `PERPLEXITY_API_KEY` = `pplx-...`  ⭐ Optional — enables Assist → Perplexity routing

**Automation tokens:**
- [ ] `GITHUB_TOKEN` = `ghp_...`
- [ ] `VERCEL_TOKEN` = `vercel_...`

Run `node config/setup-ai-keys.js` at any time to validate your current keys.

---

## Section 7 — Security

- **Never commit real API keys.** The `.env` file is in `.gitignore`.
- Use `.env.example` as a reference for key formats — it contains only dummy values.
- On Vercel, keys are stored as encrypted environment variables and never
  exposed in build logs or source maps.
- OmniAI error messages are sanitized — internal stack traces and SDK errors
  are logged server-side only and never sent to the browser.

---

## Section 8 — Troubleshooting

| Problem | Fix |
|---|---|
| "OpenAI is not configured" error | Add `OPENAI_API_KEY` to your `.env` or Vercel env vars |
| "Anthropic (Claude) is not configured" | Add `ANTHROPIC_API_KEY` |
| "Perplexity is not configured" | Add `PERPLEXITY_API_KEY` (or switch from Perplexity mode) |
| Assist mode returns GPT-4o for research | Perplexity key is missing — add it to enable live research |
| Blank page after deploy | Check that `npm run build` succeeded; check Vercel deploy logs |
| API keys work locally but not on Vercel | Add keys to Vercel env vars (not just `.env`) |

For more help, see the [GIS + Housing AI Stack guide](guides/gis-housing-ai-stack.md).
