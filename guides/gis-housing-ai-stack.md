# GIS + Affordable Housing AI Stack — 2026 Guide

> **Who this is for:** GIS consultants and affordable housing developers who want
> to use AI to move faster on LIHTC deals, zoning research, Python scripting,
> site analysis, and grant writing — without paying for tools that overlap or
> duplicate each other.

---

## Why One AI Is Not Enough

Using only one AI — even a powerful one like Perplexity Pro — leaves real
efficiency on the table. Each leading AI model has a distinct strength:

| Problem you're solving | Why one AI falls short |
|---|---|
| Writing a Python script for ArcGIS | Perplexity is a research tool, not a coder |
| Tracking today's LIHTC funding news | Claude has a knowledge cutoff; it can't browse |
| Analyzing a 200-page EIR document | GPT-4o can summarize, but Claude's 200k context handles it better |
| Reading aerial imagery of a site | Most text models can't process images natively |

The solution is a **specialized stack**: route each task to the AI that was
built for it, then let OmniAI's **Assist mode** handle the routing automatically.

---

## Your 2026 AI Stack

### 🧠 Claude 3.5 Sonnet (Anthropic) — The GIS Coder & Document Expert

**Best for:**
- Writing and debugging Python scripts for ArcGIS, QGIS, GeoPandas, GDAL
- Reading and summarizing long planning documents, EIRs, and LIHTC applications
- Drafting grant proposals, developer fee agreements, and partnership documents
- Analyzing complex regulatory language (zoning ordinances, HUD guidelines)

**Why it wins here:** Claude has a 200,000-token context window — it can read an
entire city general plan in a single prompt. It is also the strongest model
available for Python coding tasks and nuanced instruction-following.

**Example prompts:**
- "Write a Python script using GeoPandas to batch-clip all shapefiles in a
  folder to a study area boundary."
- "Summarize the key affordability covenants in this regulatory agreement."
- "Draft a developer fee memo explaining our 15% fee on a $12M TDC project."

---

### 🔍 Perplexity Pro (sonar-pro) — The Real-Time Researcher

**Best for:**
- Tracking the latest changes to LIHTC allocation plans and QAP scoring criteria
- Finding current zoning codes, city council decisions, and planning commission agendas
- Researching active funding opportunities (HOME, CDBG, state housing trust funds)
- Market research: neighborhood demographics, rent trends, comparable projects
- Any question where the answer depends on what happened this week or this year

**Why it wins here:** Unlike Claude, GPT-4o, and Gemini, Perplexity searches the
live web at query time and cites its sources. This is irreplaceable for tracking
regulatory changes and funding cycles that shift quarterly.

**Example prompts:**
- "What are the latest scoring criteria for 9% LIHTC in [state] for 2026?"
- "Find recent HUD HOME funding awards in [city or county]."
- "What changed in the 2026 One Big Beautiful Bill Act for affordable housing?"

**Important:** Perplexity is optional in OmniAI. If you don't have a key,
Assist mode routes research questions to GPT-4o instead — you still get answers,
but without live web citations.

---

### ✨ Gemini 1.5 Pro (Google) — The GIS Vision & Data Model

**Best for:**
- Analyzing site photos, aerial imagery, and satellite views
- Reading PDFs of site plans, floor plans, and zoning maps
- Data-heavy tasks: feasibility math, density calculations, floor-area-ratio analysis
- Google Workspace integration (Sheets, Drive, Maps)

**Why it wins here:** Gemini is Google's multimodal model — it can "see" images
and PDFs, not just read text. For a GIS and housing developer, this means you
can drop in a site photo and ask about setbacks, topography, or massing.

**Example prompts:**
- "Analyze this aerial photo and estimate the buildable area after setbacks."
- "Review this site plan PDF and flag any issues with parking or open-space ratios."
- "Calculate net rentable area and income at 60% AMI for these unit types."

---

### 💬 GPT-4o (OpenAI) — The Agentic Workflow Engine

**Best for:**
- Multi-step agentic tasks (search, summarize, draft — all in one prompt)
- General-purpose writing: emails, memos, meeting summaries, investor updates
- Orchestrating other tools and APIs (web browsing, code execution)
- Fallback for research when Perplexity is not configured

**Why it wins here:** GPT-4o is the strongest general-purpose model and the best
at following multi-step instructions across different types of tasks. It's the
default for anything that doesn't fit a specialist bucket.

**Example prompts:**
- "Search [city]'s planning website for the current zoning for parcel [APN],
  then draft a one-page memo summarizing the development potential."
- "Write a project update email for our LIHTC investor based on these notes."

---

## Task → Best Tool (Quick Reference)

| Task | Best Tool | Why |
|---|---|---|
| Research zoning updates / funding news | Perplexity Pro | Live web search + citations |
| Write Python GIS scripts (ArcGIS/QGIS) | Claude 3.5 | Best Python coder, understands GIS libs |
| Read long planning documents / EIRs | Claude 3.5 | 200k context window |
| Draft grant proposals / developer agreements | Claude 3.5 | Nuanced instruction-following |
| Analyze site imagery or aerial photos | Gemini 1.5 Pro | Multimodal vision |
| Analyze PDFs of site plans / zoning maps | Gemini 1.5 Pro | Native PDF understanding |
| Feasibility math / density / FAR calculations | Gemini 1.5 Pro | Strong data/math reasoning |
| Multi-step agentic workflows | GPT-4o | Strongest general orchestration |
| Write emails, memos, investor updates | GPT-4o | Clear, professional prose |
| Everything else | Assist (auto-routed) | OmniAI picks the right model |

---

## How OmniAI "Assist" Mode Works

When you select **Assist (Smart Stack)** in OmniAI, every message is
automatically classified into one of five task buckets before being sent to
an AI:

| Bucket | Triggered by | Routed to |
|---|---|---|
| Research | "zoning update", "funding opportunity", "what changed", "find sources" | Perplexity |
| Coding | "python", "script", "arcgis", "qgis", "debug", "automate" | Claude |
| Long-doc / Analysis | "summarize", "grant", "waterfall", "proforma", "planning document" | Claude |
| GIS / Data | "parcel", "imagery", "map", "calculate", "spatial", "shapefile" | Gemini |
| Writing / Agentic | (default — emails, memos, multi-step tasks) | GPT-4o |

The response includes a tag showing which AI handled it (e.g., **Assist → Perplexity**),
so you always know what ran.

---

## What Breaks (and What Still Works) Without Perplexity

Perplexity is **optional but strongly recommended** for this domain.

| Feature | Without Perplexity | With Perplexity |
|---|---|---|
| Python GIS scripting | ✅ Claude handles it | ✅ Claude handles it |
| Grant drafting | ✅ Claude handles it | ✅ Claude handles it |
| Site image analysis | ✅ Gemini handles it | ✅ Gemini handles it |
| General writing / memos | ✅ GPT-4o handles it | ✅ GPT-4o handles it |
| Real-time zoning / funding research | ⚠️ GPT-4o answers (no live web, no citations) | ✅ Perplexity with live citations |
| "What changed in the 2026 QAP?" | ⚠️ May have outdated info | ✅ Current answer with sources |

**Bottom line:** Without a Perplexity key, OmniAI still works for 80%+ of your
daily tasks. You can add Perplexity later by running `./install.sh --reconfigure-keys`.

---

## Building Wealth with This Stack in 2026

### Developer and Asset Management Fees
The primary wealth-building mechanism in affordable housing is structured fees,
not monthly rent. Use AI to accelerate the work that generates those fees:

- **Developer fees (7–15% of TDC):** Use Claude to draft fee memos and explain
  waterfall structures to investors; use Perplexity to track legislative changes
  (e.g., the 2026 OBBBA expansion of 9% LIHTC credits) that open new deal flow.
- **Asset management fees:** Use GPT-4o to draft quarterly investor reports and
  annual compliance summaries faster.

### Tax Incentives
- **4% LIHTC + bonds:** The private-activity bond threshold dropped from 50% to 25%
  in 2026 — ask Perplexity to pull the latest state guidance and find deals that
  now qualify.
- **Cost segregation:** Use Claude to understand which building components qualify
  for accelerated depreciation; use Gemini to analyze construction documents.

### Monetizing Your GIS Expertise
- **GIS consulting:** Use Claude to automate repetitive Python workflows, making
  you faster and able to take on more clients.
- **Spatial analytics:** Use Gemini to analyze site imagery at scale for other
  developers who lack your skills.
- **PropTech tools:** Use this GitHub AI stack to prototype and license tools that
  automate permitting and entitlement research — a high-margin revenue stream.

---

## Other Tools That Complement This Stack

These tools work well alongside OmniAI for specialized GIS and housing tasks:

| Tool | Best for |
|---|---|
| QGIS MCP Server | Let LLMs interact directly with your GIS data |
| ArcGIS Urban / CityEngine | Simulate zoning impacts, 3D massing studies |
| NotebookLM (Google) | Upload city regulations and ask Q&A questions |
| TestFit / DeepBlocks | Rapid massing and zoning compliance studies |
| ALFReD AI | Housing policy, financing, and regulatory updates |

---

*OmniAI Assist mode automatically picks the right AI for each task. You can also
override the model selection at any time using the model picker in the chat UI.*
