/**
 * lib/cost-calculator.js
 *
 * Reusable cost estimation logic for OmniAI.
 * Cost constants are in USD per 1,000 tokens based on published provider pricing.
 */

// USD per 1,000 tokens (input / output)
export const COST_PER_1K = {
  'gpt-4o':        { input: 0.0025, output: 0.0100 },
  'gpt-4-turbo':   { input: 0.0100, output: 0.0300 },
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
  'claude':        { input: 0.0030, output: 0.0150 },
  'gemini':        { input: 0.0000, output: 0.0000 },  // free tier
  'perplexity':    { input: 0.0000, output: 0.0000 },  // subscription-based
};

export function estimateCost(model, inputTokens = 0, outputTokens = 0) {
  const rates = COST_PER_1K[model] ?? { input: 0, output: 0 };
  return (inputTokens / 1000) * rates.input + (outputTokens / 1000) * rates.output;
}

export function buildUsage(model, usageFromSdk = {}) {
  const inputTokens = usageFromSdk.prompt_tokens ?? usageFromSdk.input_tokens ?? 0;
  const outputTokens = usageFromSdk.completion_tokens ?? usageFromSdk.output_tokens ?? 0;
  const estimatedCostUsd = estimateCost(model, inputTokens, outputTokens);
  return { inputTokens, outputTokens, estimatedCostUsd };
}

export function aggregateUsage(providerUsage) {
  const totalCostUsd = Object.values(providerUsage).reduce(
    (sum, u) => sum + (u?.estimatedCostUsd ?? 0),
    0
  );
  return { estimatedCostUsd: Number(totalCostUsd.toFixed(8)) };
}
