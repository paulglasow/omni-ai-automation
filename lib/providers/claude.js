import Anthropic from '@anthropic-ai/sdk';
import { buildUsage } from '../cost-calculator.js';

export function isConfigured() {
  return !!process.env.ANTHROPIC_API_KEY;
}

export async function call(messages) {
  if (!isConfigured()) throw new Error('ANTHROPIC_API_KEY not set. Add it to your .env.local file.');

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const systemMsg = messages.find((m) => m.role === 'system');
  const userMsgs = messages.filter((m) => m.role !== 'system');

  const res = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2048,
    system: systemMsg?.content,
    messages: userMsgs,
  });

  return {
    content: res.content[0].text,
    usage: buildUsage('claude', res.usage),
  };
}
