import { NextResponse } from 'next/server';
import { route } from '../../../lib/providers/router.js';

export const maxDuration = 30; // Allow up to 30s for parallel AI calls

export async function POST(request) {
  try {
    const body = await request.json();
    const { messages = [], prompt, model = 'assist' } = body;

    // Accept either messages[] or a plain prompt string
    const chatMessages = messages.length
      ? messages
      : [{ role: 'user', content: String(prompt ?? '') }];

    if (!chatMessages.some((m) => m.role === 'user' && m.content.trim())) {
      return NextResponse.json({ error: 'No message provided.' }, { status: 400 });
    }

    const result = await route(chatMessages, model);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[api/chat] Error:', err);

    // Friendly error messages
    let message = err.message;
    if (message.includes('API key'))  message = err.message; // already friendly
    else if (message.includes('429')) message = 'Rate limit reached. Please try again shortly.';
    else if (message.includes('500')) message = 'AI provider is temporarily unavailable.';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
