import { NextResponse } from 'next/server';

/**
 * GET /api/status
 * Returns which AI providers are configured — booleans only, no key values.
 */
export async function GET() {
  return NextResponse.json({
    providers: {
      claude: {
        configured: !!process.env.ANTHROPIC_API_KEY,
        name: 'Claude (Anthropic)',
        bestFor: 'Long writing, synthesis, document analysis, strategy, thoughtful reasoning',
      },
      openai: {
        configured: !!process.env.OPENAI_API_KEY,
        name: 'GPT-4o (OpenAI)',
        bestFor: 'Coding, debugging, implementation help, general tasks',
      },
      gemini: {
        configured: !!process.env.GEMINI_API_KEY,
        name: 'Gemini (Google)',
        bestFor: 'Structured analysis, tabular reasoning, math, data tasks, GIS',
      },
      perplexity: {
        configured: !!process.env.PERPLEXITY_API_KEY,
        name: 'Perplexity',
        bestFor: 'Current information, recent developments, source-finding, research',
        note: 'Optional but recommended — powers research-aware Assist mode',
      },
    },
    supabase: {
      configured: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    },
  });
}
