import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildUsage } from '../cost-calculator.js';

export function isConfigured() {
  return !!process.env.GEMINI_API_KEY;
}

export async function call(messages) {
  if (!isConfigured()) throw new Error('GEMINI_API_KEY not set. Add it to your .env.local file.');

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  // Gemini takes a plain text prompt — use last user message
  const prompt = messages
    .filter((m) => m.role === 'user')
    .map((m) => m.content)
    .join('\n\n');

  const res = await model.generateContent(prompt);
  const text = res.response.text();
  const meta = res.response.usageMetadata ?? {};

  return {
    content: text,
    usage: buildUsage('gemini', {
      prompt_tokens: meta.promptTokenCount ?? 0,
      completion_tokens: meta.candidatesTokenCount ?? 0,
    }),
  };
}
