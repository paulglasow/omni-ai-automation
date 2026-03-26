# Financial Setup Guide
## OmniAI v4 — Empower + Monarch Integration

> This guide explains in plain English how to connect your financial accounts to OmniAI v4 and get the most value from AI-powered financial analysis.

---

## What Financial Integration Does

When OmniAI is connected to your financial accounts, you can ask questions like:

- *"How much did I spend on dining this month compared to last month?"*
- *"Is my investment portfolio beating inflation?"*
- *"If I cut my streaming subscriptions, how much more could I save for retirement?"*
- *"Give me a net worth report with trends over the past 6 months"*

OmniAI reads your data, processes it through multiple AI models, and gives you actionable insights — not generic advice.

---

## Part 1: Empower (Investment & Net Worth Tracking)

### What Empower tracks

- Investment accounts (brokerage, IRA, 401k)
- Bank accounts
- Loans and mortgages
- Net worth over time
- Investment performance vs. benchmarks

### Setting up Empower

1. **Create a free account** at https://www.empower.com
2. **Connect your accounts** using the on-screen prompts (Plaid is used for secure bank connections)
3. **Wait 24 hours** for initial data sync
4. **Request API access** by emailing: support@empower.com
   - Subject: "API access request for personal use"
   - Body: "I'd like API access to connect my Empower data to a personal AI assistant tool."
5. Once approved (1–2 business days), go to **Settings → Developer** to find your credentials
6. Copy `Client ID` and `Client Secret` into your `.env` file

### Best Empower prompts for OmniAI

```
"Show me my net worth trend for the past 12 months. Am I growing my wealth?"

"Which of my investments have the highest fees (expense ratios)? 
 How much am I paying in fees per year?"

"Compare my asset allocation to a recommended portfolio for my age. 
 What adjustments should I make?"

"How much of my portfolio is in stocks vs. bonds vs. cash? 
 Is this appropriate for someone planning to retire in [X] years?"
```

---

## Part 2: Monarch Money (Budgeting & Cash Flow)

### What Monarch tracks

- Monthly income and spending by category
- Budget vs. actual comparisons
- Financial goals and savings targets
- Bill tracking and upcoming payments
- Subscription detection

### Setting up Monarch

1. **Start a free trial** at https://www.monarchmoney.com (14 days free)
2. **Connect your accounts** (banks, credit cards, loans)
3. **Set up budget categories** that match your spending patterns
4. Go to **Settings → Developer Settings → API Tokens**
5. Click **"Create Token"**, name it `OmniAI-v4`
6. Copy the token into your `.env` file as `MONARCH_TOKEN`

### Best Monarch prompts for OmniAI

```
"What were my top 5 spending categories this month? 
 How do they compare to last month?"

"I want to save $500 more per month. 
 Based on my spending, where are the easiest places to cut?"

"I have a goal of saving $10,000 by December. 
 Based on my current savings rate, will I hit it? 
 What do I need to change?"

"Show me a list of my recurring subscriptions. 
 Which ones have I used least in the past 3 months?"

"How does my spending this year compare to last year, by category? 
 Where am I improving and where am I getting worse?"
```

---

## Part 3: Combined Financial Analysis (The Real Power)

When you have both Empower and Monarch connected, you can ask questions that use both sources:

```
"Give me my complete financial picture:
 - Net worth from Empower (and trend)
 - Monthly cash flow from Monarch (income - spending)
 - Biggest opportunities to improve in both areas
 - One concrete action I should take this week"
```

```
"I'm thinking about buying a house in 2 years. 
 Based on my Monarch cash flow and Empower savings, 
 can I realistically save for a 20% down payment? 
 What's my plan?"
```

```
"Tax planning: Based on my Empower investment gains and 
 Monarch income, estimate my tax situation. 
 What can I do before year-end to minimize my tax bill?"
```

---

## Privacy & Security

- **Read-only access**: OmniAI can never move money, pay bills, or change anything
- **Encrypted storage**: Your credentials are stored encrypted in Supabase
- **No AI training**: Your financial data is never used to train AI models
- **What gets sent to AI**: Only summaries and aggregates, never account numbers or routing numbers
- **Revoke anytime**: Delete your API tokens from Empower/Monarch at any time

---

## Troubleshooting Financial Integration

| Problem | Solution |
|---|---|
| "No financial data available" | Check that your Empower/Monarch accounts are fully connected |
| Balances look outdated | Empower and Monarch sync daily — check their apps first |
| API authentication fails | Re-generate your tokens and update `.env` |
| Empower API access denied | Their API is invite-only — email them again or use manual mode |

### Manual mode (no API needed)

Even without API access, you can get financial analysis by manually providing context:

> "Based on the following financial snapshot: [paste your data], give me analysis and recommendations."

---

## Glossary (Plain English)

| Term | What it means |
|---|---|
| Net worth | Everything you own (assets) minus everything you owe (liabilities) |
| Asset allocation | How your investments are split between stocks, bonds, cash, etc. |
| Expense ratio | Annual fee charged by a fund, expressed as a percentage |
| Cash flow | Money coming in (income) minus money going out (spending) |
| Benchmark | A standard to compare against (e.g., S&P 500 index) |
| Rebalance | Adjusting your investments back to your target allocation |