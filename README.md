# OmniAI v4 — Multi-Model AI Automation

> One download. One command. Four AIs working together.

## ⚡ Quick Start

```bash
# 1. Download this repository (or clone it)
git clone https://github.com/paulglasow/omni-ai-automation.git
cd omni-ai-automation

# 2. Run the installer — it handles everything
chmod +x install.sh
./install.sh
```

That's it. The installer will guide you through the rest.

---

## 📖 Documentation

| File | What it is |
|---|---|
| **[IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)** | 📚 THE only guide you need — complete non-technical walkthrough |
| **[guides/financial-setup.md](guides/financial-setup.md)** | 💰 Empower + Monarch financial integration |
| **[guides/work-integration.md](guides/work-integration.md)** | 💼 GitHub Copilot and work productivity |
| **[guides/hobby-automation.md](guides/hobby-automation.md)** | 🎨 Multi-AI orchestration for creative projects |
| **[guides/collaborator-guide.md](guides/collaborator-guide.md)** | 👥 Send this to people you invite |

---

## 🗂️ Project Structure

```
omni-ai-automation/
├── IMPLEMENTATION_GUIDE.md       # THE ONLY GUIDE NEEDED
├── install.sh                    # Run this once, does everything
├── README.md                     # This file
├── config/
│   ├── setup-ai-keys.js          # Validate AI API keys
│   ├── setup-github.js           # GitHub token validation
│   ├── setup-vercel.js           # Vercel deployment
│   ├── setup-supabase.js         # Database setup
│   └── setup-siri.js             # Apple Shortcuts configuration
├── templates/
│   ├── .env.template             # Copy to .env and fill in your keys
│   ├── omni-v4.jsx               # React chat interface
│   ├── electron-main.js          # Desktop app (optional)
│   └── supabase-schema.sql       # Database schema
└── guides/
    ├── financial-setup.md        # Empower + Monarch deep dive
    ├── work-integration.md       # GitHub Copilot integration
    ├── hobby-automation.md       # Multi-AI creative workflows
    └── collaborator-guide.md     # Guide for people you invite
```

---

## 🤖 The 4 AIs

| AI | Best for |
|---|---|
| **ChatGPT** (OpenAI) | Creative writing, coding, general questions |
| **Claude** (Anthropic) | Document analysis, long-form writing, reasoning |
| **Gemini** (Google) | Data analysis, math, research |
| **Perplexity** | Real-time web search, current events |

---

## ⚙️ Installer Options

```bash
./install.sh                          # Full installation
./install.sh --reconfigure            # Re-run full setup
./install.sh --reconfigure-keys       # Re-enter API keys only
./install.sh --update-token GITHUB    # Update a specific token
./install.sh --help                   # Show all options
```

---

## 📋 Prerequisites

- Mac or Windows PC
- Internet connection
- ~45 minutes for initial setup

Everything else (Node.js, npm packages, database tables) is handled automatically by `install.sh`.

---

## 🔒 Security

- API keys stored locally in `.env` (never committed to git)
- Financial data access is read-only — no money can be moved
- Supabase uses Row Level Security — users only see their own data
- `.env` is in `.gitignore` by default

---

## 🆘 Need Help?

1. Read: **[IMPLEMENTATION_GUIDE.md → Section 14 (Troubleshooting)](IMPLEMENTATION_GUIDE.md#14-troubleshooting)**
2. Open an issue: **https://github.com/paulglasow/omni-ai-automation/issues**

---

*OmniAI v4 — Making AI work for you, not the other way around.*
