# OmniAI v4 — Manual Setup Steps

These tasks cannot be fully automated because they require browser logins,
account verifications, or device-specific configuration.

Time estimate: **~1 hour** (most of it waiting for page loads and email confirmations)

---

## 1. Email Account Setup and Forwarding (~15 min)

### Goal
All your email accounts feed into one inbox so OmniAI can search all messages.

### Steps

**Set up Gmail as your primary inbox (if not already):**
1. Go to [gmail.com](https://mail.google.com) and sign in
2. Click the **gear icon** → **"See all settings"**
3. Click the **"Accounts and Import"** tab
4. Under "Check mail from other accounts", click **"Add a mail account"**
5. Enter your other email address and follow the wizard

**Set up email forwarding from other accounts:**

*For Microsoft/Outlook:*
1. Go to [outlook.com](https://outlook.com) → Settings (gear) → View all settings
2. Click **Mail** → **Forwarding**
3. Enable forwarding and enter your Gmail address
4. Check "Keep a copy of forwarded messages"

*For Apple Mail/iCloud:*
1. Go to [icloud.com/mail](https://icloud.com/mail)
2. Click the gear icon → **Preferences** → **Accounts**
3. Enable forwarding to Gmail

**Test:** Send an email to each account and confirm it arrives in Gmail.

---

## 2. Calendar Synchronization (~10 min)

### Goal
All calendars visible in one place (Apple Calendar or Google Calendar).

### Steps

**Add Google Calendar to macOS:**
1. Click **Apple menu** → **System Settings** → **Internet Accounts**
2. Click **"+"** → **"Google"**
3. Sign in and enable **Calendars**
4. Open Calendar app — Google events should appear

**Add Microsoft 365 Calendar:**
1. Click **Apple menu** → **System Settings** → **Internet Accounts**
2. Click **"+"** → **"Microsoft Exchange"**
3. Sign in with your Microsoft 365 credentials
4. Enable **Calendars**

**Verify:** Open Calendar app — all events from all accounts should appear.

---

## 3. Financial Account Linking (~20 min)

### Empower (free portfolio tracking)

1. Go to [empower.com](https://www.empower.com/personal-wealth)
2. Click **"Get Started"** → create a free account
3. Click **"Link Account"** and connect:
   - Bank accounts (checking, savings)
   - Investment accounts (401k, IRA, brokerage)
   - Credit cards (for net worth tracking)
4. Wait 1-2 minutes for balances to load
5. Note your **Net Worth** on the dashboard

**Why use it:** Tracks all assets in one place, shows investment performance over time.

### Monarch Money (budgeting)

1. Go to [monarchmoney.com](https://www.monarchmoney.com)
2. Start 7-day free trial (requires credit card, cancel if not needed)
3. Click **"Connect Accounts"** → link bank and credit cards
4. Set up budget categories:
   - Housing (mortgage/rent, utilities)
   - Food (groceries, dining)
   - Transportation (gas, insurance)
   - Entertainment
   - Savings

**Why use it:** Shows spending patterns, helps identify where to reduce costs.

---

## 4. Siri Shortcuts Creation (~15 min)

### Goal
Use voice commands to open OmniAI and send queries hands-free.

### Prerequisites
- iPhone with iOS 16+ or Mac with macOS Ventura+
- OmniAI deployed to Vercel (from automated setup)

### Steps

**Shortcut 1: "Open OmniAI"**
1. Open **Shortcuts** app on iPhone
2. Tap **"+"** to create a new shortcut
3. Tap **"Add Action"** → search **"Open URLs"**
4. Enter your Vercel URL: `https://omni-ai-yourname.vercel.app`
5. Tap the shortcut name (top of screen) → rename to **"Open OmniAI"**
6. Tap **"Add to Siri"** → record phrase: **"Open OmniAI"**

**Test:** Say "Hey Siri, Open OmniAI" — your app should open in Safari.

**Shortcut 2: "Ask OmniAI" (optional advanced)**
1. Create a new shortcut
2. Add action: **"Ask for Input"** → prompt: "What's your question?"
3. Add action: **"Open URLs"** → URL: `https://omni-ai-yourname.vercel.app?q=[Provided Input]`
4. Name it **"Ask OmniAI"**
5. Add to Siri

**Test:** Say "Hey Siri, Ask OmniAI" → speak your question → app opens with it pre-filled.

---

## 5. GoDaddy Domain Setup (if applicable, ~10 min)

If you have a custom domain on GoDaddy:

1. Log in to [godaddy.com](https://godaddy.com) → **My Products**
2. Click **DNS** next to your domain
3. Add a CNAME record:
   - **Name:** `omni` (or `app`, or `www`)
   - **Value:** `cname.vercel-dns.com`
   - **TTL:** 1 hour
4. In Vercel → your project → **Settings** → **Domains**
5. Click **"Add"** and enter `omni.yourdomain.com`
6. Vercel will verify the DNS record (can take up to 24 hours to propagate)

**Result:** Your app will be accessible at `omni.yourdomain.com`

---

## 6. Microsoft 365 Setup (~15 min)

If using Microsoft 365 for business email:

1. Log in to [admin.microsoft.com](https://admin.microsoft.com)
2. Go to **Users** → **Active users** → select your account
3. Under **Mail** → **Manage email apps** → ensure "Outlook" is checked
4. Set up any email aliases under **Manage username and email**

**Connect to macOS Mail:**
1. Open **Mail** app → **Mail** menu → **Add Account**
2. Select **Microsoft Exchange**
3. Enter your Microsoft 365 email and sign in
4. Enable Mail, Contacts, Calendar as needed

---

## 7. Password Manager Setup (Recommended, ~10 min)

Secure storage for all your tokens and credentials.

**Recommended: Bitwarden (free)**
1. Go to [bitwarden.com](https://bitwarden.com) → create free account
2. Install browser extension and mobile app
3. Add each API key as a **Secure Note** with this format:
   ```
   Name: OmniAI - OpenAI API Key
   Notes: sk-proj-...
   URL: https://platform.openai.com/api-keys
   Created: 2026-03-24
   Expires: 2026-06-24
   ```
4. Install desktop app on macOS for quick access

**Alternative: 1Password** ($2.99/month) — more polished interface

---

## Troubleshooting Manual Steps

**Siri doesn't respond to shortcut name**
→ Make sure the Siri trigger phrase is recorded in quiet surroundings

**Email forwarding not working**
→ Check spam folder; some providers require you to click a verification link

**Calendar events not syncing**
→ Open System Settings → Internet Accounts → toggle the account off and on

**Domain not resolving to Vercel**
→ DNS propagation can take up to 48 hours — use [dnschecker.org](https://dnschecker.org) to monitor

**Empower not connecting to account**
→ Try using the mobile app instead of web; some banks have better mobile support
