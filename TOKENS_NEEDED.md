# OmniAI v4 — API Keys & Tokens Guide

This guide tells you exactly where to get each token, what permissions to set,
and what the key looks like so you can confirm you have the right one.

---

## 1. GitHub Personal Access Token

**Used for:** Creating the omni-ai repository and configuring CI/CD secrets  
**Starts with:** `ghp_` (classic) or `github_pat_` (fine-grained)  
**Cost:** Free

### Steps
1. Go to: **https://github.com/settings/tokens?type=beta**
2. Click **"Generate new token (fine-grained)"**
3. **Token name:** `OmniAI Setup`
4. **Expiration:** 90 days (recommended)
5. Under **Repository access**, select **"All repositories"**
6. Under **Permissions → Repository permissions**, set:
   - `Contents` → **Read and write**
   - `Secrets` → **Read and write**
   - `Workflows` → **Read and write**
   - `Metadata` → **Read-only** (auto-selected)
7. Under **Permissions → Account permissions**, set:
   - `Administration` → **Read and write** (needed to create repos)
8. Click **"Generate token"**
9. **Copy immediately** — you won't see it again

### What it looks like
```
github_pat_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890
```

---

## 2. Vercel API Token

**Used for:** Deploying your app and managing Vercel project settings  
**Cost:** Free

### Steps
1. Go to: **https://vercel.com/account/tokens**
2. Click **"Create"**
3. **Token name:** `OmniAI Deploy`
4. **Scope:** Your personal account (or team if applicable)
5. **Expiration:** No expiration (or set 90 days for security)
6. Click **"Create Token"**
7. **Copy immediately** — shown only once

### What it looks like
```
AbCdEfGhIjKlMnOpQrStUvWxYz1234567890abcdefghijklmnopqrstuvwxyz12
```
(Long alphanumeric string, no prefix)

---

## 3. Supabase Management API Token

**Used for:** Creating your Supabase project and running the database schema  
**Cost:** Free (Supabase free tier)

### Steps
1. Go to: **https://supabase.com/dashboard/account/tokens**
2. Click **"Generate new token"**
3. **Token name:** `OmniAI Database`
4. Click **"Generate token"**
5. **Copy immediately** — shown only once

### What it looks like
```
sbp_abcdefghijklmnopqrstuvwxyz1234567890abcdef
```

---

## 4. OpenAI API Key (GPT-4 / ChatGPT)

**Used for:** AI responses, code generation, natural language processing  
**Cost:** $5-10 in API credits (pay as you go, not subscription)  
**Estimated monthly usage:** $1-5 for personal use

### Steps
1. Go to: **https://platform.openai.com/signup** and create an account
2. Verify your phone number (required)
3. Click your **profile icon** (top right) → **"API keys"**
4. Click **"Create new secret key"**
5. **Name:** `OmniAI`
6. Click **"Create secret key"**
7. **Copy immediately** — never shown again
8. Go to **Billing** (left sidebar):
   - Click **"Add payment method"** → add a credit card
   - Click **"Add to credit balance"** → add $5-10

### What it looks like
```
sk-proj-ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnop
```

### Billing tip
Set a monthly spending limit under **Billing → Usage limits** to avoid surprise charges.

---

## 5. Google Gemini API Key

**Used for:** Google's AI model (alternative/complement to ChatGPT)  
**Cost:** FREE — no billing required  
**Rate limits:** 15 requests/minute on free tier

### Steps
1. Go to: **https://aistudio.google.com**
2. Sign in with your Google account
3. Click **"Get API key"** in the top navigation
4. Click **"Create API key in new project"**
5. Copy the generated key

### What it looks like
```
AIzaSyABCDEFGHIJKLMNOPQRSTUVWXYZ1234567
```

---

## 6. Perplexity API Key

**Used for:** AI-powered web search, real-time information retrieval  
**Cost:** $5 minimum to start, then pay-per-use  
**Estimated monthly usage:** $1-3 for personal use

### Steps
1. Go to: **https://www.perplexity.ai** and create an account
2. Click your **profile icon** → **"Settings"**
3. Click **"API"** in the left sidebar
4. Click **"Generate"**
5. **Copy immediately**
6. Go to **Billing** → add a credit card and $5 in credits

### What it looks like
```
pplx-abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmno
```

---

## 7. GitHub Copilot Token

**Used for:** AI code completion, two-way Copilot chat integration  
**Cost:** $10/month (Individual plan) or $19/month (Business)  
**Requirement:** Active Copilot subscription

### Steps
1. Subscribe at: **https://github.com/features/copilot** (Individual: $10/mo)
2. Once subscribed, go to: **https://github.com/settings/tokens?type=beta**
3. Click **"Generate new token (fine-grained)"**
4. **Name:** `OmniAI Copilot`
5. **Expiration:** 90 days
6. Under **Account permissions**:
   - Find `GitHub Copilot Chat` → set to **Read-only**
7. Click **"Generate token"**
8. **Copy immediately**

### What it looks like
```
github_pat_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890
```

---

## Cost Summary

| Service | Monthly Cost | Notes |
|---------|-------------|-------|
| GitHub Token | FREE | Expires — renew every 90 days |
| Vercel | FREE | Hobby plan, no credit card required |
| Supabase | FREE | Free tier: 500 MB database |
| OpenAI | ~$1-5/month | Pay-per-use (after $5 one-time deposit) |
| Gemini | FREE | Rate-limited but free |
| Perplexity | ~$1-3/month | Pay-per-use (after $5 one-time deposit) |
| GitHub Copilot | $10/month | Optional but recommended |
| **TOTAL** | **~$12-18/mo** | Plus $10 one-time for initial API credits |

> **Note:** OpenAI and Perplexity require a one-time prepaid credit deposit ($5 each)
> before you can make API calls. These are not recurring subscriptions — you only pay
> for what you use. Set spending limits at each provider to avoid surprise charges.

---

## 🔒 Security Best Practices

1. **Never share tokens in chat, email, or screenshots**
2. **Set expiration dates** — 90 days is a good balance of security and convenience
3. **Use a password manager** (1Password, Bitwarden) to store tokens
4. **Set spending limits** on OpenAI and Perplexity to cap costs
5. **Rotate tokens** if you think one was exposed — go to each provider and regenerate
6. **Review token usage** monthly at each provider's dashboard
7. **Never commit** `.env` to git (it's in `.gitignore`)

---

## Renewal Schedule

Set a calendar reminder to renew tokens before they expire:

| Token | Reminder |
|-------|---------|
| GitHub Token | 80 days after creation |
| Vercel Token | If set to expire: 80 days |
| All API keys | Monthly billing review |
