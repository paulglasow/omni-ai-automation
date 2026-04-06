import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../lib/supabase/server.js';
import { route } from '../../../lib/providers/router.js';

const MEETING_SYSTEM = `Extract from this meeting transcript:
1) Summary (2-3 sentences)
2) Attendees (if mentioned)
3) Key Topics
4) Decisions Made (numbered)
5) Action Items (table: Task | Owner | Due | Priority)
6) Open Questions
7) Next Meeting date if mentioned.
Format clearly with headers.`;

export async function GET() {
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ meetings: [] });

  const { data } = await db.from('meetings').select('*').order('created_at', { ascending: false }).limit(50);
  return NextResponse.json({ meetings: data || [] });
}

export async function POST(request) {
  const db = getSupabaseAdmin();
  const { title, content, analyze } = await request.json();

  if (!content?.trim()) return NextResponse.json({ error: 'Meeting content is required' }, { status: 400 });

  // Save meeting
  let meeting = { title, content, created_at: new Date().toISOString() };
  if (db) {
    const { data, error } = await db.from('meetings').insert({ title, content }).select().single();
    if (!error) meeting = data;
  }

  // Optionally analyze with AI
  let analysis = null;
  if (analyze) {
    try {
      const messages = [
        { role: 'system', content: MEETING_SYSTEM },
        { role: 'user', content: content },
      ];
      const result = await route(messages, 'assist');
      analysis = result.content;
    } catch (err) {
      analysis = `Analysis failed: ${err.message}`;
    }
  }

  return NextResponse.json({ meeting, analysis });
}
