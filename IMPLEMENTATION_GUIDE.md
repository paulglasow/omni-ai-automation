# OmniAI v4 — Complete Implementation Guide

> **The only guide you need.** Read this from start to finish, then run `./install.sh`.  
> No jumping around. No scattered steps. One guide. One command.

---

## 📋 Table of Contents

1. [Before You Start](#1-before-you-start)
2. [What OmniAI v4 Does for You](#2-what-omni-ai-v4-does-for-you)
3. [Step 1 — Download & Prepare (5 min)](#3-step-1--download--prepare-5-min)
4. [Step 2 — Create Your AI Accounts (15 min)](#4-step-2--create-your-ai-accounts-15-min)
5. [Step 3 — Set Up Financial Integrations (10 min)](#5-step-3--set-up-financial-integrations-10-min)
6. [Step 4 — Set Up Work Integrations (5 min)](#6-step-4--set-up-work-integrations-5-min)
7. [Step 5 — Run the Installer (5–10 min)](#7-step-5--run-the-installer-510-min)
8. [Step 6 — Verify Everything Works (5 min)](#8-step-6--verify-everything-works-5-min)
9. [Using OmniAI Daily](#9-using-omni-ai-daily)
10. [Financial Goals — Empower & Monarch](#10-financial-goals--empower--monarch)
11. [Work Products — GitHub Copilot Integration](#11-work-products--github-copilot-integration)
12. [Hobbies — Multi-AI Orchestration](#12-hobbies--multi-ai-orchestration)
13. [Inviting Collaborators](#13-inviting-collaborators)
14. [Troubleshooting](#14-troubleshooting)
15. [Security Best Practices](#15-security-best-practices)

---

## 1. Before You Start

### What you need (plain English)

| Requirement | Why you need it | Do you have it? |
|---|---|---|
| A Mac or Windows PC | To run the software | ☐ Yes ☐ No |
| Internet connection | To connect to AI services | ☐ Yes ☐ No |
| An email address | To create accounts | ☐ Yes ☐ No |
| ~45 minutes of free time | To complete setup | ☐ Yes ☐ No |
| A credit/debit card | Some services have free tiers with paid options | ☐ Yes ☐ No |

> ✅ **If you checked all of those, you're ready to begin.**

### What you do NOT need
- Any programming experience
- Any technical background
- Any special software installed beforehand (the installer handles it)

### Time estimates for each section

| Section | Time |
|---|---|
| Reading this guide | 20–30 min |
| Creating AI accounts | 15 min |
| Financial integrations | 10 min |
| Work integrations | 5 min |
| Running the installer | 5–10 min |
| **Total** | **~45 min** |

---

## 2. What OmniAI v4 Does for You

OmniAI v4 is your personal AI command center. Instead of logging into 4 different AI websites separately, you interact with one interface and OmniAI automatically:

- **Routes your question** to the best AI for that topic
- **Combines answers** from multiple AIs into one better answer
- **Connects to your finances** (Empower + Monarch) for personalized money insights
- **Integrates with your work** (GitHub Copilot) for coding and document help
- **Coordinates creative projects** using multiple AIs working together

### The 4 AIs working for you

```
Your Question
     ↓
[OmniAI v4 Router]
     ↓
┌────────────┬──────────────┬──────────────┬─────────────────┐
│  ChatGPT   │    Claude    │    Gemini    │   Perplexity    │
│ (OpenAI)   │ (Anthropic)  │  (Google)    │  (Web Search)   │
│            │              │              │                  │
│ Best for:  │ Best for:    │ Best for:    │ Best for:        │
│ Creativity │ Long docs    │ Data/math    │ Current news     │
│ Coding     │ Analysis     │ Research     │ Real-time info   │
└────────────┴──────────────┴──────────────┴─────────────────┘
     ↓
Combined, Better Answer
```

### Perplexity Integration — Evaluation

**Is Perplexity duplicative of the other AI integrations? No.** Each AI in OmniAI v4 provides capabilities the others cannot:

| AI | Unique Capability | What It Adds Over Perplexity |
|---|---|---|
| **ChatGPT (OpenAI)** | Creative writing, code generation, structured JSON output | Static knowledge base, deterministic reasoning, no per-query web-search cost |
| **Claude (Anthropic)** | 200k-token context window, nuanced long-document analysis | Processes full books/reports in one prompt; Perplexity truncates context |
| **Gemini (Google)** | Multimodal reasoning (text + images/video), tight Google ecosystem tie-in | Can analyze images and spreadsheet data; Perplexity is text-only |
| **Perplexity** | **Real-time web search, inline citations, live data** | The only model here that actively queries the internet at inference time |

**What Perplexity adds that the others cannot provide:**
- **Live internet access** — answers are grounded in today's web, not a training cut-off from months ago
- **Inline citations** — every factual claim links back to a source URL
- **Breaking news & current events** — stock prices, sports scores, today's headlines, new product releases
- **Up-to-date research** — recent papers, newly published data, regulatory changes

**Auto-routing logic** (`api/chat.js`): When you use "Auto (Best AI)" mode, OmniAI routes queries containing keywords like *"latest," "current," "news," "price," "today"* automatically to Perplexity, while code questions go to GPT-4o, long-document tasks go to Claude, and data/math questions go to Gemini.

---

## 3. Step 1 — Download & Prepare (5 min)

### Option A: Download as ZIP (Easiest — Recommended)

1. Go to: **https://github.com/paulglasow/omni-ai-automation**
2. Click the green **"Code"** button
3. Click **"Download ZIP"**
4. Open your Downloads folder
5. Double-click the ZIP file to extract it
6. You now have a folder called `omni-ai-automation`

### Option B: Use Git (For tech-savvy users)

Open your Terminal (Mac) or Command Prompt (Windows) and type:

```bash
git clone https://github.com/paulglasow/omni-ai-automation.git
cd omni-ai-automation
```

### Verify the folder structure

After downloading, open the folder. You should see:

```
omni-ai-automation/
├── IMPLEMENTATION_GUIDE.md  ← You are reading this
├── install.sh               ← The magic button
├── README.md
├── config/
├── templates/
└── guides/
```

> ✅ **If you see those files and folders, you're ready for Step 2.**

---

## 4. Step 2 — Create Your AI Accounts (15 min)

You need API keys from 4 AI services. An **API key** is like a password that lets OmniAI talk to each AI on your behalf. This section walks you through getting each one.

> 💡 **Tip:** Keep a text file open to paste your keys as you get them. You'll need them in Step 5.

---

### 4a. OpenAI (ChatGPT) — ~3 min

**Cost:** Pay-as-you-go (~$0.002 per 1,000 words). Budget $5–20/month for regular use.

1. Go to: **https://platform.openai.com/signup**
2. Create an account using your email
3. Verify your email address
4. Go to: **https://platform.openai.com/api-keys**
5. Click **"Create new secret key"**
6. Give it a name: `OmniAI-v4`
7. Click **"Create secret key"**
8. **COPY THE KEY NOW** — you can only see it once!
9. Paste it somewhere safe (your text file)

Your key looks like: `sk-proj-abc123...`

---

### 4b. Anthropic (Claude) — ~3 min

**Cost:** Pay-as-you-go. Budget $5–20/month for regular use.

1. Go to: **https://console.anthropic.com/signup**
2. Create an account
3. Verify your email
4. Go to: **https://console.anthropic.com/keys**
5. Click **"Create Key"**
6. Name it: `OmniAI-v4`
7. Click **"Create Key"**
8. **COPY AND SAVE THE KEY**

Your key looks like: `sk-ant-abc123...`

---

### 4c. Google Gemini — ~3 min

**Cost:** Free tier available (60 requests/minute). Paid tier for more.

1. Go to: **https://makersuite.google.com/app/apikey**
2. Sign in with your Google account
3. Click **"Create API key"**
4. Select **"Create API key in new project"**
5. **COPY AND SAVE THE KEY**

Your key looks like: `AIzaSy...`

---

### 4d. Perplexity AI — ~3 min

**Cost:** $5/month for Pro (includes API access).

1. Go to: **https://www.perplexity.ai/settings/api**
2. Create an account or sign in
3. Click **"Generate"** under API Keys
4. **COPY AND SAVE THE KEY**

Your key looks like: `pplx-abc123...`

---

### 4e. GitHub (For Copilot & Repository Access) — ~3 min

**Cost:** GitHub Copilot is $10/month or free with Student account.

1. Go to: **https://github.com/settings/tokens**
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Name it: `OmniAI-v4`
4. Set expiration: **90 days** (or "No expiration" for convenience)
5. Check these boxes under "Select scopes":
   - ✅ `repo` (Full control of repositories)
   - ✅ `read:user` (Read user profile data)
   - ✅ `user:email` (Access user email addresses)
6. Click **"Generate token"** at the bottom
7. **COPY AND SAVE THE TOKEN**

Your token looks like: `ghp_abc123...`

---

### ✅ Keys Checklist

Before moving on, confirm you have all 5 keys saved:

- [ ] OpenAI key: `sk-proj-...`
- [ ] Anthropic key: `sk-ant-...`
- [ ] Google Gemini key: `AIzaSy...`
- [ ] Perplexity key: `pplx-...`
- [ ] GitHub token: `ghp_...`

---

## 5. Step 3 — Set Up Financial Integrations (10 min)

OmniAI connects to your financial accounts so AI can give you personalized money advice, not generic tips.

> 🔒 **Security note:** OmniAI only gets **read-only access** to your financial data. It cannot move money, make purchases, or change anything. It only reads balances and transactions.

---

### 5a. Empower (formerly Personal Capital) — ~5 min

Empower tracks your net worth, investments, and retirement accounts.

1. Go to: **https://www.empower.com**
2. Create a free account (click "Sign Up Free")
3. Connect your bank accounts, investment accounts, and any retirement accounts
4. Once connected, go to your **Account Settings** → **Developer/API** section
   - *If you don't see an API option:* Empower's API access is invite-based. Email support@empower.com requesting API access for personal use.
5. Copy your **API credentials** (client ID + secret)
6. Save them to your text file labeled: `EMPOWER_CLIENT_ID` and `EMPOWER_CLIENT_SECRET`

> 💡 **Alternative:** If you can't get Empower API access, OmniAI will still work — you'll just enter your financial data manually when asking questions.

---

### 5b. Monarch Money — ~5 min

Monarch provides beautiful budgeting and financial goal tracking.

1. Go to: **https://www.monarchmoney.com**
2. Start a free trial (14 days free, then $14.99/month)
3. Connect your accounts (follow the on-screen prompts)
4. Go to: **Settings** → **Developer Settings** → **API Tokens**
5. Click **"Create Token"**
6. Name it: `OmniAI-v4`
7. Copy the token
8. Save it labeled: `MONARCH_TOKEN`

> 💡 **Note:** If you already use Mint or another budgeting tool, you can skip Monarch and manually enter budget information when talking to OmniAI.

---

## 6. Step 4 — Set Up Work Integrations (5 min)

### 6a. Vercel (Hosting) — ~3 min

Vercel hosts the OmniAI web interface so you can access it from any browser or device.

1. Go to: **https://vercel.com/signup**
2. Click **"Continue with GitHub"** (uses your existing GitHub account)
3. Authorize Vercel to access your GitHub
4. Go to: **https://vercel.com/account/tokens**
5. Click **"Create"**
6. Name it: `OmniAI-v4`
7. Copy the token
8. Save it labeled: `VERCEL_TOKEN`

---

### 6b. Supabase (Database) — ~2 min

Supabase stores your OmniAI conversation history and preferences.

1. Go to: **https://supabase.com**
2. Click **"Start your project"**
3. Sign in with GitHub
4. Click **"New project"**
5. Fill in:
   - **Name:** `omni-ai-v4`
   - **Database Password:** Create a strong password (save it!)
   - **Region:** Choose the one closest to you
6. Click **"Create new project"** (takes ~2 minutes to set up)
7. Once created, go to: **Project Settings** → **API**
8. Copy:
   - **Project URL** → save as `SUPABASE_URL`
   - **anon public key** → save as `SUPABASE_ANON_KEY`
   - **service_role key** → save as `SUPABASE_SERVICE_ROLE_KEY`

---

### ✅ All Keys Checklist

Before running the installer, confirm you have these saved:

**AI Keys:**
- [ ] `OPENAI_API_KEY` = `sk-proj-...`
- [ ] `ANTHROPIC_API_KEY` = `sk-ant-...`
- [ ] `GEMINI_API_KEY` = `AIzaSy...`
- [ ] `PERPLEXITY_API_KEY` = `pplx-...`

**GitHub:**
- [ ] `GITHUB_TOKEN` = `ghp_...`

**Financial (optional but recommended):**
- [ ] `EMPOWER_CLIENT_ID`
- [ ] `EMPOWER_CLIENT_SECRET`
- [ ] `MONARCH_TOKEN`

**Hosting/Database:**
- [ ] `VERCEL_TOKEN`
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`

---

## 7. Step 5 — Run the Installer (5–10 min)

This is where the magic happens. One command does everything.

### On Mac

1. Open **Terminal**
   - Press `Command + Space`, type "Terminal", press Enter
2. Navigate to the folder you downloaded:
   ```bash
   cd ~/Downloads/omni-ai-automation
   ```
3. Make the installer executable:
   ```bash
   chmod +x install.sh
   ```
4. Run the installer:
   ```bash
   ./install.sh
   ```
5. Follow the on-screen prompts — you'll be asked to paste each API key

### On Windows

1. Open **PowerShell as Administrator**
   - Press `Windows key`, type "PowerShell", right-click → "Run as administrator"
2. Navigate to the folder:
   ```powershell
   cd $env:USERPROFILE\Downloads\omni-ai-automation
   ```
3. Run the installer:
   ```powershell
   bash install.sh
   ```
   *(If `bash` is not recognized, install WSL first: https://docs.microsoft.com/en-us/windows/wsl/install)*

### What the installer does (automatically)

The installer will show you exactly what it's doing at each step:

```
[1/8] ✓ Checking your system requirements...
[2/8] ✓ Installing Node.js (if needed)...
[3/8] ✓ Installing project dependencies...
[4/8] ✓ Setting up your configuration file...
[5/8] ✓ Connecting to Supabase database...
[6/8] ✓ Setting up database tables...
[7/8] ✓ Deploying to Vercel...
[8/8] ✓ Running verification tests...

🎉 OmniAI v4 is ready!
Your interface is live at: https://omni-ai-v4-[yourname].vercel.app
```

> ⏱️ **This takes 5–10 minutes.** You can watch the progress on screen.

---

## 8. Step 6 — Verify Everything Works (5 min)

After the installer finishes, test each integration:

### Test 1 — Open OmniAI

1. The installer will print your URL (e.g., `https://omni-ai-v4-yourname.vercel.app`)
2. Open that URL in your browser
3. You should see the OmniAI v4 interface

✅ **Success:** You see a chat interface with the OmniAI logo  
❌ **Issue:** See [Troubleshooting — Interface Won't Load](#interface-wont-load)

### Test 2 — Ask a question to each AI

Type this question in the chat:
> "Hello! Which AI am I talking to? Please confirm you're connected."

You should see responses from all 4 AIs (ChatGPT, Claude, Gemini, Perplexity).

✅ **Success:** You get 4 different responses  
❌ **Issue:** See [Troubleshooting — AI Not Responding](#ai-not-responding)

### Test 3 — Financial integration

Type:
> "Can you see my financial overview from Empower and Monarch?"

✅ **Success:** You see a summary of your financial data  
❌ **Issue:** See [Troubleshooting — Financial Data Not Showing](#financial-data-not-showing)

### Test 4 — GitHub Copilot integration

Type:
> "Can you help me with my GitHub repositories?"

✅ **Success:** OmniAI shows your GitHub repos and offers to help  
❌ **Issue:** See [Troubleshooting — GitHub Not Connected](#github-not-connected)

---

## 9. Using OmniAI Daily

### How to ask good questions

The better your question, the better OmniAI's answer. Use this formula:

```
[Context] + [What you want] + [How you want it]
```

**Examples:**

Instead of: *"What stocks should I buy?"*  
Try: *"Based on my Empower portfolio, which of my current holdings have underperformed the S&P 500 this year? Give me a simple table."*

Instead of: *"Write code for me"*  
Try: *"I'm building a Python script to sort a list of names alphabetically. Show me the simplest way to do this with comments explaining each line."*

Instead of: *"Plan my vacation"*  
Try: *"I want to visit Japan for 10 days in April with a $3,000 budget. I love food and history but not crowded tourist spots. Create a day-by-day itinerary."*

---

### The AI Routing Guide

OmniAI automatically picks the best AI, but you can also request specific ones:

| Task Type | Best AI | How to request |
|---|---|---|
| Creative writing, stories | ChatGPT | "ChatGPT, write me a..." |
| Analyzing long documents | Claude | "Claude, summarize this..." |
| Math, data analysis, spreadsheets | Gemini | "Gemini, calculate..." |
| Current events, news, research | Perplexity | "Perplexity, what's the latest on..." |
| Code help | GitHub Copilot | "Copilot, help me code..." |
| Financial analysis | All 4 AIs combined | "Give me a full financial analysis of..." |

---

## 10. Financial Goals — Empower & Monarch

### 10a. Your Net Worth Dashboard

Every morning, ask OmniAI:
> "Give me my financial snapshot for today. Include net worth from Empower, budget status from Monarch, and any accounts that need attention."

OmniAI will pull live data and give you a plain-English summary.

### 10b. Investment Analysis

For weekly investment review:
> "Review my Empower portfolio performance this week. Compare each investment to its benchmark. Flag anything that's significantly underperforming. Suggest whether I should rebalance, in plain language."

### 10c. Budget vs. Actuals

For monthly budget check:
> "Pull my Monarch budget data for [current month]. Show me which categories I'm over budget, which I'm under, and calculate how much I'd save annually if I reduced my biggest overspend by 25%."

### 10d. Financial Goal Tracking

Set up your goals once:
> "I want to save $50,000 for a house down payment in 3 years. Based on my Monarch income and spending data, how much do I need to save monthly? Create a savings plan."

Then check in weekly:
> "Am I on track with my house savings goal? What adjustments should I make based on this month's spending?"

### 10e. Tax Planning Prompts

> "Based on my Empower investment gains and Monarch income data, estimate my tax situation for this year. Suggest 3 things I could do before December 31 to reduce my tax bill."

---

## 11. Work Products — GitHub Copilot Integration

### 11a. Code Review Help

> "Review this code I wrote and tell me: 1) Does it work correctly? 2) Is there a simpler way? 3) Are there any security issues? [paste your code]"

### 11b. Documentation Writing

> "I have a GitHub repository called [name]. Write a professional README.md for it that explains what it does, how to install it, and how to use it. Make it clear enough for a beginner."

### 11c. Pull Request Summaries

> "Look at my latest pull request in [repository name]. Write a clear summary of what changed and why, suitable for a non-technical manager."

### 11d. Bug Debugging

> "I'm getting this error: [paste error message]. Here's my code: [paste code]. Walk me through what's wrong and how to fix it, step by step."

### 11e. Project Planning

> "I want to build a [description of project]. Create a project plan with: 1) A list of features in priority order, 2) Estimated time for each, 3) What technologies to use and why, 4) Potential risks and how to avoid them."

---

## 12. Hobbies — Multi-AI Orchestration

Using multiple AIs together gives you far better results than any single AI. Here's how to orchestrate them for creative and hobby projects.

### 12a. The "4-Perspective" Technique

Ask all 4 AIs the same question and combine their answers:

**Template:**
> "I want 4 different perspectives on [your topic]:
> 1. ChatGPT — give me a creative angle
> 2. Claude — give me a detailed analytical view  
> 3. Gemini — give me data and research
> 4. Perplexity — give me the latest news and trends
> Combine the best insights into one final answer."

### 12b. Creative Projects (Writing, Music, Art)

**For writing:**
> "Help me write a short story about [topic]. Use this process:
> - Perplexity: Research 3 interesting real facts I can weave in
> - Gemini: Suggest a story structure with 5 plot points
> - ChatGPT: Write the actual story with vivid descriptions
> - Claude: Edit for clarity, pacing, and emotional impact"

**For music:**
> "I want to write a song about [theme]. 
> - Give me 5 different lyric concepts (ChatGPT)
> - Analyze the musical structure of similar songs (Gemini)
> - Find the current trends in this genre (Perplexity)
> - Write final polished lyrics (Claude)"

### 12c. Learning New Skills

> "I want to learn [skill] in 30 days. Create a structured plan:
> - Perplexity: What's the best current learning resource for this?
> - Gemini: Build a 30-day curriculum with daily tasks
> - ChatGPT: Make the daily tasks fun and engaging
> - Claude: Add accountability checkpoints and progress milestones"

### 12d. Research Projects

> "I'm researching [topic] for [reason]. Give me:
> - Perplexity: Latest news and recent developments
> - Gemini: Data, statistics, and historical context
> - Claude: Analysis of implications and what it means
> - ChatGPT: Creative applications or interesting angles
> Then synthesize everything into a 1-page summary I can share."

### 12e. Travel Planning

> "Plan my trip to [destination] in [month] with [budget]:
> - Perplexity: Current travel advisories and entry requirements
> - Gemini: Weather, best neighborhoods, transportation options
> - ChatGPT: Hidden gems, local food, off-the-beaten-path experiences
> - Claude: Full itinerary with time estimates and cost breakdown
> Give me a day-by-day plan I can follow."

---

## 13. Inviting Collaborators

### Sending a collaborator the system

1. Share your GitHub repository link with them:  
   `https://github.com/paulglasow/omni-ai-automation`
2. Tell them to read: `guides/collaborator-guide.md`
3. Send them your OmniAI URL (from Step 6)
4. Create them a collaborator account (see below)

### Adding a collaborator to GitHub

1. Go to your repository: `https://github.com/paulglasow/omni-ai-automation`
2. Click **"Settings"** → **"Collaborators"**
3. Click **"Add people"**
4. Enter their GitHub username or email
5. Choose permission level:
   - **Read** — They can view but not change anything
   - **Write** — They can make changes (for active collaborators)
   - **Admin** — They have full control (only for trusted people)

### Creating a shared workspace

For collaborators who will use OmniAI with you:

1. Share your OmniAI URL with them
2. They can use the same interface
3. For shared financial data: Only share financial integrations with people you completely trust
4. For shared projects: Each collaborator should have their own AI keys for their own usage

---

## 14. Troubleshooting

### Interface Won't Load

**Symptoms:** Opening your Vercel URL shows an error or blank page

**Solutions:**
1. Wait 5 minutes — Vercel sometimes takes time to deploy
2. Check your Vercel token is correct (re-run: `./install.sh --reconfigure`)
3. Check Vercel status: https://www.vercel-status.com
4. Look for error messages in the installer output

---

### AI Not Responding

**Symptoms:** You ask a question and get no response, or get "Error: API key invalid"

**Solutions:**
1. Double-check your API key has no extra spaces
2. Verify the key hasn't expired (check each platform's dashboard)
3. Check you have billing set up (some services require a credit card)
4. Re-run the key setup: `./install.sh --reconfigure-keys`

---

### Financial Data Not Showing

**Symptoms:** Financial queries return "No data available" or connection errors

**Solutions:**
1. Verify your Empower/Monarch accounts are fully connected (log in to each and check)
2. Re-enter your API credentials: `./install.sh --reconfigure`
3. Note: Empower API access may take 1–2 business days after requesting

---

### GitHub Not Connected

**Symptoms:** GitHub queries fail or show "Authentication failed"

**Solutions:**
1. Check your GitHub token hasn't expired
2. Create a new token at: https://github.com/settings/tokens
3. Make sure you selected the `repo` scope when creating the token
4. Update the token: `./install.sh --update-token GITHUB`

---

### Installer Fails on Mac

**Symptoms:** Error message when running `./install.sh`

**Solutions:**
1. Make sure you gave execute permission: `chmod +x install.sh`
2. Try running with explicit bash: `bash install.sh`
3. If you see "command not found: node": The installer will handle Node.js installation automatically. If it fails, install Node.js manually from https://nodejs.org

---

### Installer Fails on Windows

**Symptoms:** Error in PowerShell

**Solutions:**
1. Make sure you installed WSL: https://docs.microsoft.com/en-us/windows/wsl/install
2. Try running in WSL Ubuntu instead of PowerShell
3. Right-click PowerShell → "Run as administrator"

---

### Slow Response Times

**Symptoms:** Questions take more than 30 seconds to answer

**Solutions:**
- This is normal when asking all 4 AIs simultaneously
- For faster responses, ask just one AI: "ChatGPT only — [your question]"
- Check your internet connection speed

---

## 15. Security Best Practices

### Protect your API keys

1. **Never share your keys** with anyone, even collaborators
2. **Never paste keys into chat** (including into OmniAI itself)
3. **Store keys in your password manager** (1Password, LastPass, or Apple Keychain)
4. **Set expiration dates** on all keys — 90 days is a good default
5. **Rotate keys** if you suspect they've been compromised

### Revoke a compromised key

If you think a key was stolen:

- **OpenAI:** https://platform.openai.com/api-keys → Delete the old key, create a new one
- **Anthropic:** https://console.anthropic.com/keys → Revoke the key
- **Google:** https://console.cloud.google.com/credentials → Delete the key
- **Perplexity:** https://www.perplexity.ai/settings/api → Revoke the key
- **GitHub:** https://github.com/settings/tokens → Delete the token

### Financial data security

- OmniAI has **read-only** access to your financial data — it cannot move money
- Your credentials are stored encrypted in Supabase — they are never sent to AI services
- Financial summaries passed to AI are anonymized (no account numbers)
- Supabase is SOC2 compliant

### Password manager setup

If you don't have a password manager, set one up now:

1. **1Password** (https://1password.com) — $3/month, best overall
2. **Bitwarden** (https://bitwarden.com) — Free, open source
3. **Apple Keychain** — Free, built into Mac/iPhone

Store all your API keys in your password manager with descriptive names like "OmniAI - OpenAI Key" so you can find them later.

---

## 🎉 You Did It!

If you've followed this guide from top to bottom, you now have:

- ✅ OmniAI v4 fully installed and running
- ✅ 4 AI models connected and working together
- ✅ Financial integrations with Empower and Monarch
- ✅ GitHub Copilot integrated for work projects
- ✅ A live web interface you can access from any device
- ✅ Everything secured and encrypted

**Your OmniAI URL:** Printed at the end of `./install.sh` output

**Need help?** Open an issue at: https://github.com/paulglasow/omni-ai-automation/issues

---

*OmniAI v4 — Making AI work for you, not the other way around.*