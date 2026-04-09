/**
 * lib/qa-router.js
 *
 * Weighted scoring router for QA/QC mode.
 * Selects the best primary AI provider and the best secondary QA reviewer
 * based on prompt characteristics and attached file types.
 */

// Provider strength profiles (0-10 scale)
const PROVIDER_STRENGTHS = {
  claude:     { code: 10, analysis: 9, creative: 7, research: 5, spatial: 4, multimodal: 3 },
  openai:     { code: 7,  analysis: 8, creative: 9, research: 6, spatial: 5, multimodal: 6 },
  gemini:     { code: 5,  analysis: 6, creative: 5, research: 5, spatial: 9, multimodal: 10 },
  perplexity: { code: 3,  analysis: 5, creative: 4, research: 10, spatial: 3, multimodal: 2 },
};

// Expanded keyword groups per category with weights
// { phrase: string, weight: number } — longer/more specific phrases get higher weight
const CATEGORY_KEYWORDS = {
  code: [
    { phrase: 'refactor', weight: 3 },
    { phrase: 'debug', weight: 3 },
    { phrase: 'function', weight: 2 },
    { phrase: 'algorithm', weight: 3 },
    { phrase: 'implement', weight: 2 },
    { phrase: 'programming', weight: 3 },
    { phrase: 'code review', weight: 4 },
    { phrase: 'code', weight: 1.5 },
    { phrase: 'script', weight: 2 },
    { phrase: 'class', weight: 1.5 },
    { phrase: 'error', weight: 1.5 },
    { phrase: 'fix', weight: 1 },
    { phrase: 'bug', weight: 2 },
    { phrase: 'api', weight: 1.5 },
    { phrase: 'syntax', weight: 2 },
    { phrase: 'compile', weight: 2 },
    { phrase: 'runtime', weight: 2 },
    { phrase: 'typescript', weight: 3 },
    { phrase: 'javascript', weight: 3 },
    { phrase: 'python', weight: 3 },
    { phrase: 'sql', weight: 2 },
    { phrase: 'database', weight: 1.5 },
    { phrase: 'react', weight: 2 },
    { phrase: 'node', weight: 1.5 },
    { phrase: 'html', weight: 1.5 },
    { phrase: 'css', weight: 1.5 },
    { phrase: 'json', weight: 1 },
    { phrase: 'regex', weight: 2 },
    { phrase: 'git', weight: 1.5 },
    { phrase: 'deploy', weight: 1.5 },
  ],
  analysis: [
    { phrase: 'analyze', weight: 3 },
    { phrase: 'analysis', weight: 3 },
    { phrase: 'evaluate', weight: 3 },
    { phrase: 'compare', weight: 2 },
    { phrase: 'pros and cons', weight: 3 },
    { phrase: 'recommend', weight: 2 },
    { phrase: 'assessment', weight: 3 },
    { phrase: 'review', weight: 2 },
    { phrase: 'critique', weight: 3 },
    { phrase: 'summarize', weight: 2 },
    { phrase: 'explain', weight: 1.5 },
    { phrase: 'breakdown', weight: 2 },
    { phrase: 'insight', weight: 2 },
    { phrase: 'report', weight: 1.5 },
    { phrase: 'financial', weight: 2 },
    { phrase: 'budget', weight: 2 },
    { phrase: 'strategy', weight: 2 },
    { phrase: 'risk', weight: 2 },
    { phrase: 'forecast', weight: 2 },
    { phrase: 'metrics', weight: 2 },
  ],
  creative: [
    { phrase: 'write', weight: 2 },
    { phrase: 'story', weight: 3 },
    { phrase: 'creative', weight: 3 },
    { phrase: 'blog post', weight: 3 },
    { phrase: 'email', weight: 2 },
    { phrase: 'draft', weight: 2 },
    { phrase: 'rewrite', weight: 2 },
    { phrase: 'poem', weight: 3 },
    { phrase: 'slogan', weight: 3 },
    { phrase: 'marketing', weight: 2 },
    { phrase: 'copy', weight: 1.5 },
    { phrase: 'tone', weight: 2 },
    { phrase: 'headline', weight: 2 },
    { phrase: 'essay', weight: 2 },
    { phrase: 'letter', weight: 1.5 },
    { phrase: 'proposal', weight: 2 },
  ],
  research: [
    { phrase: 'what is', weight: 2 },
    { phrase: 'who is', weight: 2 },
    { phrase: 'latest', weight: 3 },
    { phrase: 'news', weight: 3 },
    { phrase: 'current', weight: 2 },
    { phrase: 'recent', weight: 2 },
    { phrase: 'search', weight: 2 },
    { phrase: 'find', weight: 1 },
    { phrase: 'lookup', weight: 2 },
    { phrase: 'trends', weight: 3 },
    { phrase: 'statistics', weight: 2 },
    { phrase: 'today', weight: 2 },
    { phrase: '2024', weight: 2 },
    { phrase: '2025', weight: 2 },
    { phrase: '2026', weight: 2 },
    { phrase: 'how much does', weight: 2 },
    { phrase: 'market', weight: 1.5 },
    { phrase: 'price', weight: 1.5 },
    { phrase: 'update', weight: 1 },
  ],
  spatial: [
    { phrase: 'gis', weight: 4 },
    { phrase: 'geojson', weight: 4 },
    { phrase: 'shapefile', weight: 4 },
    { phrase: 'coordinates', weight: 3 },
    { phrase: 'spatial', weight: 3 },
    { phrase: 'map', weight: 2 },
    { phrase: 'zoning', weight: 3 },
    { phrase: 'parcel', weight: 3 },
    { phrase: 'lihtc', weight: 4 },
    { phrase: 'affordable housing', weight: 3 },
    { phrase: 'census', weight: 2 },
    { phrase: 'boundary', weight: 2 },
    { phrase: 'latitude', weight: 3 },
    { phrase: 'longitude', weight: 3 },
    { phrase: 'geocode', weight: 4 },
    { phrase: 'polygon', weight: 3 },
    { phrase: 'raster', weight: 3 },
    { phrase: 'elevation', weight: 2 },
  ],
  multimodal: [
    { phrase: 'image', weight: 3 },
    { phrase: 'photo', weight: 3 },
    { phrase: 'picture', weight: 3 },
    { phrase: 'screenshot', weight: 3 },
    { phrase: 'diagram', weight: 3 },
    { phrase: 'chart', weight: 2 },
    { phrase: 'visual', weight: 2 },
    { phrase: 'pdf', weight: 1.5 },
    { phrase: 'scan', weight: 2 },
    { phrase: 'ocr', weight: 3 },
  ],
};

// Image file extensions that boost multimodal scoring
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.tiff'];

/**
 * Score a prompt against all categories.
 * Returns { category: totalWeightedScore } for each category.
 */
function scorePrompt(prompt) {
  const lower = prompt.toLowerCase();
  const scores = {};

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const { phrase, weight } of keywords) {
      if (lower.includes(phrase)) {
        score += weight;
      }
    }
    scores[category] = score;
  }

  return scores;
}

/**
 * Route a prompt for QA/QC mode.
 *
 * @param {string} prompt - The user's prompt text
 * @param {Array<{name: string, type: string}>} [files] - Attached files (name + type)
 * @returns {{ primary: string, secondary: string, bucket: string, scores: Record<string, number> }}
 */
export function routeForQA(prompt, files = []) {
  const categoryScores = scorePrompt(prompt);

  // Boost multimodal score if image files are attached
  const hasImages = files.some((f) => {
    const ext = f.name?.toLowerCase().match(/\.\w+$/)?.[0];
    return ext && IMAGE_EXTENSIONS.includes(ext);
  });
  if (hasImages) {
    categoryScores.multimodal = (categoryScores.multimodal ?? 0) + 8;
  }

  // Calculate per-provider scores by multiplying category scores by provider strengths
  const providerScores = {};
  for (const [provider, strengths] of Object.entries(PROVIDER_STRENGTHS)) {
    let total = 0;
    for (const [category, catScore] of Object.entries(categoryScores)) {
      total += catScore * (strengths[category] ?? 0);
    }
    providerScores[provider] = Math.round(total * 10) / 10;
  }

  // If all scores are 0 (generic prompt), use default strengths
  const maxScore = Math.max(...Object.values(providerScores));
  if (maxScore === 0) {
    // Default: OpenAI primary (best generalist), Claude secondary (best analysis)
    return {
      primary: 'openai',
      secondary: 'claude',
      bucket: 'general',
      scores: { openai: 1, claude: 0.9, gemini: 0.5, perplexity: 0.3 },
    };
  }

  // Sort providers by score descending
  const sorted = Object.entries(providerScores)
    .sort(([, a], [, b]) => b - a);

  const primary = sorted[0][0];
  const secondary = sorted[1][0];

  // Determine the dominant bucket (highest-scoring category)
  const dominantBucket = Object.entries(categoryScores)
    .sort(([, a], [, b]) => b - a)[0][0];

  return {
    primary,
    secondary,
    bucket: dominantBucket,
    scores: providerScores,
  };
}

/**
 * Build the QA system prompt for the secondary reviewer.
 */
export function buildQASystemPrompt(primaryProvider) {
  return `You are a senior QA reviewer evaluating an AI-generated analysis. The primary analysis was produced by ${primaryProvider.toUpperCase()}.

Your role is to:
1. Evaluate the accuracy and completeness of the primary analysis
2. Identify any errors, logical flaws, unsupported claims, or important gaps
3. Provide your own independent perspective on the original question
4. Rate the primary analysis quality on this scale: Excellent / Good / Needs Improvement / Poor
5. Produce a Combined Recommendation that synthesizes the best insights from both analyses

Structure your response EXACTLY in these sections:

## Quality Assessment
[Rating and key findings about the primary analysis]

## Identified Issues
[Errors, gaps, or areas for improvement — or "None identified" if the analysis is solid]

## Additional Perspective
[Your own analysis of the original question, adding anything the primary missed]

## Combined Recommendation
[A synthesized final answer incorporating the strongest elements from both the primary analysis and your review. This should be the definitive answer the user can act on.]`;
}

/**
 * Build the QA user message containing the original request and primary output.
 */
export function buildQAUserMessage(originalPrompt, primaryContent, primaryProvider, fileContext) {
  let message = `**Original request:**\n${originalPrompt}\n`;

  if (fileContext) {
    message += `\n**Attached file content:**\n${fileContext}\n`;
  }

  message += `\n**Primary analysis by ${primaryProvider.toUpperCase()}:**\n---\n${primaryContent}\n---\n\nPlease provide your QA/QC evaluation and combined recommendation.`;

  return message;
}
