/**
 * lib/cost-calculator.js
 *
 * Reusable cost estimation logic for OmniAI v4.
 * Cost constants are in USD per 1,000 tokens based on published provider pricing.
 */

// USD per 1,000 tokens (input / output)
// Notes:
// - Gemini costs are $0.00 within the free-tier quota; charges apply beyond the quota
//   (see https://ai.google.dev/pricing for current limits)
// - Perplexity uses a subscription model; per-request cost is $0.00 regardless of usage
//   (see https://www.perplexity.ai/pro for current plan pricing)
// Update these values whenever provider pricing changes.
export const COST_PER_1K = {
  'gpt-4o':      { input: 0.0025, output: 0.0100 },
  'gpt-4-turbo': { input: 0.0100, output: 0.0300 },
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
  'claude':      { input: 0.0030, output: 0.0150 },  // claude-3-sonnet / claude-3-5-sonnet
  'gemini':      { input: 0.0000, output: 0.0000 },  // free tier
  'perplexity':  { input: 0.0000, output: 0.0000 },  // subscription-based
};

/**
 * Estimate the cost of a single API call in USD.
 *
 * @param {string} model - Model key matching COST_PER_1K (e.g. 'gpt-4o')
 * @param {number} inputTokens
 * @param {number} outputTokens
 * @returns {number} estimated cost in USD
 */
export function estimateCost(model, inputTokens = 0, outputTokens = 0) {
  const rates = COST_PER_1K[model] ?? { input: 0, output: 0 };
  return (
    (inputTokens / 1000) * rates.input +
    (outputTokens / 1000) * rates.output
  );
}

/**
 * Build a usage object from SDK token counts.
 *
 * @param {string} model - Model key
 * @param {object} usageFromSdk - SDK usage object (prompt_tokens / completion_tokens)
 * @returns {{ inputTokens: number, outputTokens: number, estimatedCostUsd: number }}
 */
export function buildUsage(model, usageFromSdk = {}) {
  const inputTokens = usageFromSdk.prompt_tokens ?? usageFromSdk.input_tokens ?? 0;
  const outputTokens = usageFromSdk.completion_tokens ?? usageFromSdk.output_tokens ?? 0;
  const estimatedCostUsd = estimateCost(model, inputTokens, outputTokens);
  return { inputTokens, outputTokens, estimatedCostUsd };
}

/**
 * Aggregate multiple per-provider usage objects into a total.
 *
 * @param {Object.<string, {estimatedCostUsd: number}>} providerUsage
 * @returns {{ estimatedCostUsd: number }}
 */
export function aggregateUsage(providerUsage) {
  const totalCostUsd = Object.values(providerUsage).reduce(
    (sum, u) => sum + (u.estimatedCostUsd ?? 0),
    0
  );
  return { estimatedCostUsd: Number(totalCostUsd.toFixed(8)) };
}
