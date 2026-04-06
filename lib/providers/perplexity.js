import { buildUsage } from '../cost-calculator.js';

export function isConfigured() {
  return !!process.env.PERPLEXITY_API_KEY;
}

export async function call(messages) {
  if (!isConfigured()) throw new Error('PERPLEXITY_API_KEY not set. Add it to your .env.local file.');

  const res = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar',
      messages,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Perplexity API error: ${res.status} ${res.statusText}. ${text}`);
  }

  const data = await res.json();
  return {
    content: data.choices[0].message.content,
    usage: buildUsage('perplexity', data.usage ?? {}),
  };
}
