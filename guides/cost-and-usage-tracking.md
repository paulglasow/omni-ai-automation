# Cost & Usage Tracking

OmniAI v4 automatically estimates the cost of every AI request and returns usage metadata in the API response. This guide explains how to interpret usage data and manage your API spend.

---

## How Cost Tracking Works

Every call to `/api/chat` returns a `usage` object alongside the AI response:

```json
{
  "content": "Here is the answer to your question…",
  "model": "assist",
  "routedTo": "perplexity",
  "bucket": "research",
  "usage": {
    "perplexity": {
      "inputTokens": 42,
      "outputTokens": 157,
      "estimatedCostUsd": 0.0000
    },
    "total": {
      "estimatedCostUsd": 0.0000
    }
  }
}
```

The `usage` field breaks down token counts and estimated cost by provider. In `all` mode, each provider appears as a separate key.

---

## Cost Estimates vs. Real Billing

> **Important**: OmniAI shows *estimates* only. Your actual charges appear on each provider's dashboard (OpenAI, Anthropic, Google Cloud, Perplexity).

| Provider | Pricing model | Notes |
|---|---|---|
| GPT-4o | Per token (input + output) | Rates from OpenAI pricing page |
| Claude 3.5 Sonnet | Per token (input + output) | Rates from Anthropic pricing page |
| Gemini 1.5 Pro | Free tier / per token | Free up to quota; paid beyond |
| Perplexity | Subscription | Monthly flat fee; shown as $0.00 |

Cost constants are defined in `lib/cost-calculator.js` and can be updated as provider pricing changes.

---

## Enabling/Disabling Cost Estimates

Cost reporting is **on by default**. To disable it (e.g., in public demos where you don't want to expose cost data):

```bash
# .env or Vercel environment variable
ENABLE_COST_ESTIMATES=false
```

When disabled, the `usage` field is omitted from all API responses.

---

## UI Cost Badges

The OmniAI v4 UI (`templates/omni-v4.jsx`) displays a green cost badge next to each assistant message:

```
💰 $0.0012
```

A session total is displayed in the header bar:

```
Session: 💰 $0.0087
```

If the cost is `$0.00` (e.g., Perplexity subscription or Gemini free tier), no badge is shown.

---

## Logging Costs to Supabase

When a request includes a `workspaceId` or is made by an authenticated user, the cost is automatically logged to the `usage_logs` table:

| Column | Description |
|---|---|
| `user_id` | Supabase user who made the request |
| `workspace_id` | Workspace billed for the request (nullable) |
| `model` | Model selected by the user |
| `routed_to` | Actual provider used (in assist mode) |
| `input_tokens` | Tokens in the prompt |
| `output_tokens` | Tokens in the response |
| `cost_usd` | Estimated cost in USD |
| `created_at` | Request timestamp |

Anonymous requests (no Auth header) are still served but are not persisted.

---

## Usage Summary API

Retrieve aggregated cost data for a workspace:

```http
GET /api/usage/:workspaceId/summary?from=2024-01-01&to=2024-01-31
Authorization: Bearer <supabase_jwt>
```

Response:

```json
{
  "totalRequests": 142,
  "totalInputTokens": 58200,
  "totalOutputTokens": 143000,
  "totalEstimatedCostUsd": 1.8734,
  "byModel": {
    "openai": { "requests": 45, "inputTokens": 18200, "outputTokens": 52000, "estimatedCostUsd": 0.5655 },
    "claude": { "requests": 38, "inputTokens": 15500, "outputTokens": 44000, "estimatedCostUsd": 0.7065 },
    "gemini": { "requests": 35, "inputTokens": 12000, "outputTokens": 29000, "estimatedCostUsd": 0.0000 },
    "perplexity": { "requests": 24, "inputTokens": 12500, "outputTokens": 18000, "estimatedCostUsd": 0.0000 }
  }
}
```

Personal usage (unauthenticated sessions excluded from workspaces):

```http
GET /api/usage/personal?from=2024-01-01
Authorization: Bearer <supabase_jwt>
```

---

## Budget Alerts

Set a monthly spending threshold for a workspace:

```http
POST /api/usage/:workspaceId/alerts
Authorization: Bearer <supabase_jwt>
Content-Type: application/json

{
  "thresholdUsd": 50.00,
  "notifyEmail": "admin@example.com"
}
```

> **Note**: Alert notification delivery (email/SMS) is a future feature. The threshold is stored and can be queried; push notifications will be added in a follow-up release.

---

## Updating Cost Constants

Provider pricing changes regularly. To update the rates, edit `lib/cost-calculator.js`:

```javascript
export const COST_PER_1K = {
  'gpt-4o':      { input: 0.0025, output: 0.0100 },  // USD per 1K tokens
  'claude':      { input: 0.0030, output: 0.0150 },
  'gemini':      { input: 0.0000, output: 0.0000 },
  'perplexity':  { input: 0.0000, output: 0.0000 },
};
```

All cost calculations flow through `estimateCost()` in this file — there is a single source of truth for rates.
