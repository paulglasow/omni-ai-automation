import OpenAI from 'openai';
import { buildUsage } from '../cost-calculator.js';

export function isConfigured() {
  return !!process.env.OPENAI_API_KEY;
}

export async function call(messages) {
  if (!isConfigured()) throw new Error('OPENAI_API_KEY not set. Add it to your .env.local file.');

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const res = await client.chat.completions.create({
    model: 'gpt-4o',
    messages,
  });

  return {
    content: res.choices[0].message.content,
    usage: buildUsage('gpt-4o', res.usage),
  };
}
