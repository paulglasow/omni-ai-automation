# OmniAI v4 — Setup Checklist

Use this checklist to track your progress. Automated steps run with `npm run setup`.
Manual steps include links and time estimates.

---

## Phase 1: Web Deployment — AUTOMATED (~5 min) ✅

- [ ] Clone this repository
- [ ] Run `npm install`
- [ ] Run `npm run setup`
- [ ] Enter GitHub token when prompted
- [ ] Enter Vercel token when prompted
- [ ] Enter Supabase token when prompted
- [ ] Confirm live URL appears in output (e.g. `omni-ai-yourname.vercel.app`)
- [ ] Run `npm run verify` — all checks pass

**Success criteria:** Live URL loads in browser, GitHub Actions workflow is visible.

---

## Phase 2: Database — AUTOMATED (~5 min) ✅

> Handled automatically during Phase 1.

- [ ] Supabase project `omni-ai` appears in dashboard
- [ ] Schema applied (tables visible in Table Editor)
- [ ] `SUPABASE_URL` and `SUPABASE_ANON_KEY` filled in `.env`

**Success criteria:** `npm run verify` shows Supabase ✅

---

## Phase 3: AI API Keys — MANUAL (~30 min) 📝

See **TOKENS_NEEDED.md** for step-by-step instructions for each key.

### OpenAI (GPT-4) — ~10 min, requires $5-10 billing
- [ ] Create account at [platform.openai.com](https://platform.openai.com/signup)
- [ ] Generate API key (`sk-...`)
- [ ] Add billing credit ($5 minimum)
- [ ] Add `OPENAI_API_KEY=sk-...` to `.env`

### Google Gemini — ~5 min, FREE
- [ ] Go to [aistudio.google.com](https://aistudio.google.com)
- [ ] Click "Get API key" → "Create API key in new project"
- [ ] Copy key (`AIza...`)
- [ ] Add `GEMINI_API_KEY=AIza...` to `.env`

### Perplexity — ~10 min, requires $5 billing
- [ ] Create account at [perplexity.ai](https://www.perplexity.ai)
- [ ] Go to Settings → API → Generate key (`pplx-...`)
- [ ] Add billing credit ($5 minimum)
- [ ] Add `PERPLEXITY_API_KEY=pplx-...` to `.env`

**Success criteria:** Each key format validated by `npm run validate`

---

## Phase 4: GitHub Copilot — MANUAL (~10 min) 📝

- [ ] Subscribe to GitHub Copilot at [github.com/features/copilot](https://github.com/features/copilot) ($10/mo)
- [ ] Generate fine-grained token with Copilot Chat permission
- [ ] Add `GITHUB_COPILOT_TOKEN=github_pat_...` to `.env`

**Success criteria:** Copilot responds in VS Code / GitHub web

---

## Phase 5: Google Accounts — MANUAL (~15 min) 📝

- [ ] Set up Gmail account (or use existing)
- [ ] Enable Google Calendar API (optional, for calendar sync)
- [ ] Connect Google Drive if using document storage
- [ ] Add Google account to macOS System Preferences → Internet Accounts

**Success criteria:** Siri can access Google Calendar events

---

## Phase 6: GoDaddy / Microsoft 365 — MANUAL (~20 min) 📝

- [ ] Log in to [GoDaddy](https://godaddy.com) and note your domain
- [ ] Set up email forwarding to your primary inbox (if desired)
- [ ] Log in to [Microsoft 365](https://office.com) admin portal
- [ ] Configure any email aliases or distribution lists
- [ ] Add Microsoft account to macOS Mail app

**Success criteria:** Email from all accounts arrives in one inbox

---

## Phase 7: Siri Integration — MANUAL (~15 min) 📝

See **MANUAL_STEPS.md → Siri Shortcuts** for full instructions.

- [ ] Open Shortcuts app on iPhone/Mac
- [ ] Create shortcut: "Hey Siri, open OmniAI" → opens your Vercel URL
- [ ] Create shortcut: "Hey Siri, ask OmniAI..." → sends query to your app
- [ ] Test each shortcut with voice activation

**Success criteria:** "Hey Siri, open OmniAI" loads the app

---

## Phase 8: Wealth Setup — MANUAL (~20 min) 📝

### Empower (free portfolio tracking)
- [ ] Create account at [empower.com](https://www.empower.com)
- [ ] Link bank and investment accounts
- [ ] Note your net worth dashboard URL

### Monarch Money (budgeting)
- [ ] Create account at [monarchmoney.com](https://www.monarchmoney.com)
- [ ] Link bank and credit card accounts
- [ ] Set up budget categories

**Success criteria:** Both apps show current balances

---

## Phase 9: Account Overview — MANUAL (~10 min) 📝

- [ ] List all automated accounts in a secure note:
  - GitHub: `github.com/paulglasow`
  - Vercel: `vercel.com/dashboard`
  - Supabase: `supabase.com/dashboard`
  - OpenAI: `platform.openai.com`
  - Gemini: `aistudio.google.com`
  - Perplexity: `perplexity.ai/settings/api`
  - Empower: `empower.com`
  - Monarch: `monarchmoney.com`
- [ ] Save credentials to password manager (1Password, Bitwarden, etc.)
- [ ] Set calendar reminder to rotate API keys every 90 days

**Success criteria:** All accounts accessible, passwords saved securely

---

## Time Summary

| Phase | Time | Automated? |
|-------|------|-----------|
| 1 — Web Deployment | 5 min | ✅ Yes |
| 2 — Database | 5 min | ✅ Yes |
| 3 — AI Keys | 30 min | 📝 Manual |
| 4 — GitHub Copilot | 10 min | 📝 Manual |
| 5 — Google Accounts | 15 min | 📝 Manual |
| 6 — GoDaddy / M365 | 20 min | 📝 Manual |
| 7 — Siri | 15 min | 📝 Manual |
| 8 — Wealth Setup | 20 min | 📝 Manual |
| 9 — Account Overview | 10 min | 📝 Manual |
| **TOTAL** | **~130 min** | 10 min automated |

> Most of the manual time is waiting for accounts to load and for email/billing to process.
> Active work is closer to 45 minutes.
