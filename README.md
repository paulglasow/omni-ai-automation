# OmniAI v4

Multi-AI personal assistant platform. Chat with 4 AI providers, analyze files, track tasks, manage finances — all in one place.

## Features

- **Multi-AI Chat** — Assist mode auto-routes to the best AI (Claude, GPT-4o, Gemini, Perplexity)
- **Smart Routing** — Research → Perplexity, Code → GPT-4o, Writing → Claude, Data → Gemini
- **File Upload & Analysis** — Upload text files, get AI-powered analysis
- **Task Manager** — Priority-based task tracking
- **Meeting Transcriber** — Paste transcript → AI extracts action items & decisions
- **Wealth & Finance** — Empower/Monarch data → AI financial analysis
- **Learning Tracker** — Track topics with progress bars
- **GitHub & Code** — Code review, debugging, AI-assisted development
- **Workspaces** — Organize work into shareable projects
- **Google OAuth** — Secure multi-user authentication via Supabase
- **Mobile Responsive** — Works on iPhone & desktop, installable as PWA
- **Server-Side AI** — All API keys stay on the server, never exposed to browser

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/paulglasow/omni-ai-automation.git
cd omni-ai-automation
npm install

# 2. Add your keys
cp .env.example .env.local
# Edit .env.local with your API keys

# 3. Run locally
npm run dev
# Open http://localhost:3000
```

## Environment Variables

Create `.env.local` with:

```env
# Required — at least one AI provider
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIza...
PERPLEXITY_API_KEY=pplx-...

# Required — Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Go to SQL Editor → paste `supabase/schema.sql` → Run
3. Go to Storage → Create bucket named `uploads` (private, 25MB limit)
4. (Optional) Enable Google OAuth: Authentication → Providers → Google

## Deploy to Vercel

```bash
npx vercel --prod
```

Or import the repo at [vercel.com](https://vercel.com) and add your env vars.

## Architecture

- **Next.js 14** App Router with JavaScript
- **Tailwind CSS** for styling
- **Supabase** for database, auth, file storage
- **4 AI Providers** called server-side via `/api/chat`
- **Assist Mode** uses keyword heuristics to route to the best provider

## How Assist Mode Works

Assist analyzes your message and routes to the best AI:

| Query Type | Provider | Keywords |
|---|---|---|
| Research | Perplexity | latest, news, trends, current, search |
| Code | GPT-4o | code, debug, implement, function |
| Writing | Claude | write, draft, analyze, strategy |
| Data/GIS | Gemini | map, data, math, spreadsheet, zoning |

If the preferred provider is not configured, Assist falls back gracefully to the next available provider.
