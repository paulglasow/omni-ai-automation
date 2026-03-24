# OmniAI v4 — Automated Setup

Reduce your OmniAI v4 setup from **2-3 hours to ~45 minutes** with one command.

## ⚡ Quick Start

```bash
git clone https://github.com/paulglasow/omni-ai-automation.git
cd omni-ai-automation
npm install
npm run setup
```

That's it. The wizard handles everything else.

---

## 📋 Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | ≥ 18 | [nodejs.org](https://nodejs.org) |
| npm | ≥ 9 | Included with Node.js |
| git | any | [git-scm.com](https://git-scm.com) |

---

## 🔑 Tokens You'll Need

You'll be prompted for **3 tokens** during setup:

| Token | Where to get it | Cost |
|-------|----------------|------|
| GitHub Token | [github.com/settings/tokens](https://github.com/settings/tokens?type=beta) | Free |
| Vercel Token | [vercel.com/account/tokens](https://vercel.com/account/tokens) | Free |
| Supabase Token | [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens) | Free |

See **[TOKENS_NEEDED.md](TOKENS_NEEDED.md)** for step-by-step instructions.

---

## ✅ What Gets Automated (~5 minutes)

- **GitHub** — Creates `omni-ai` repository, uploads source files, configures secrets
- **Vercel** — Creates project, connects GitHub, deploys live URL
- **Supabase** — Creates project, runs database schema, retrieves API keys
- **.env file** — Generated automatically with all credentials filled in

## 📝 What's Manual (~40 minutes)

- AI API keys (OpenAI, Gemini, Perplexity) — add to `.env` after setup
- Email forwarding and calendar sync
- Financial account linking (Empower, Monarch)
- Siri shortcuts
- GoDaddy / Microsoft 365

See **[SETUP_CHECKLIST.md](SETUP_CHECKLIST.md)** for the full checklist with time estimates.

---

## 🛠️ Available Commands

```bash
npm run setup     # Run the full automated setup wizard
npm run validate  # Check your .env file for missing variables
npm run verify    # Confirm GitHub, Vercel, and Supabase are all working
npm run build     # Build the React app
npm run deploy    # Deploy to Vercel manually
npm run dev       # Start development server
```

Or with Make:

```bash
make setup   # Run full automation
make status  # Check setup progress
make clean   # Remove build artifacts
```

---

## 📁 Repository Structure

```
omni-ai-automation/
├── setup.sh                    # Shell entry point (calls npm run setup)
├── package.json                # Dependencies and scripts
├── vercel.json                 # Vercel project configuration
├── .env.template               # Environment variables template
├── .env.example                # Example values (safe to commit)
├── .gitignore                  # Keeps secrets out of git
│
├── scripts/
│   ├── run-setup.js            # Main orchestrator (npm run setup)
│   ├── github-setup.js         # GitHub repo + secrets
│   ├── vercel-deploy.js        # Vercel project + deployment
│   ├── supabase-init.js        # Supabase project + schema
│   ├── env-generator.js        # .env file writer
│   ├── validate-env.js         # .env validation
│   └── verify-setup.js         # Post-setup health checks
│
├── .github/
│   └── workflows/
│       └── deploy.yml          # Auto-deploy on push to main
│
├── README.md                   # This file
├── SETUP_CHECKLIST.md          # Phase-by-phase checklist
├── TOKENS_NEEDED.md            # API key generation guide
├── DEPLOYMENT_GUIDE.md         # CI/CD setup instructions
├── MANUAL_STEPS.md             # Non-automated tasks
└── SAMPLE_SETUP_OUTPUT.txt     # What a successful run looks like
```

---

## 🔒 Security

- Tokens are **never logged** to the console or stored in git
- `.env` is in `.gitignore` — will never be committed
- Repository secrets are encrypted before being sent to GitHub
- Service role keys are kept server-side only

---

## 🆘 Troubleshooting

**Setup fails at GitHub step**
→ Ensure your token has `repo` and `workflow` scopes

**Vercel deployment not appearing**
→ Check [vercel.com/dashboard](https://vercel.com/dashboard) — first deploy can take 3-5 minutes

**Supabase project not ready**
→ Wait 2 minutes and re-run `npm run verify`

**Token format errors**
→ Run `npm run validate` to see which variables are missing or malformed

For detailed troubleshooting, see **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)**.

---

## 📚 Documentation

| File | Contents |
|------|----------|
| [SETUP_CHECKLIST.md](SETUP_CHECKLIST.md) | Complete phase-by-phase checklist |
| [TOKENS_NEEDED.md](TOKENS_NEEDED.md) | How to generate every API key |
| [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) | CI/CD and Vercel setup |
| [MANUAL_STEPS.md](MANUAL_STEPS.md) | Email, finance, Siri, and more |
| [SAMPLE_SETUP_OUTPUT.txt](SAMPLE_SETUP_OUTPUT.txt) | What a successful run looks like |