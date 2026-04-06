import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../../lib/supabase/server.js';

/**
 * GET /api/conversations/[id]/messages — load message history
 * POST /api/conversations/[id]/messages — save a message
 */

export async function GET(request, { params }) {
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ messages: [] });

  const { data } = await db
    .from('messages')
    .select('*')
    .eq('conversation_id', params.id)
    .order('created_at', { ascending: true });

  return NextResponse.json({ messages: data || [] });
}

export async function POST(request, { params }) {
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });

  const body = await request.json();

  const { data, error } = await db
    .from('messages')
    .insert({
      conversation_id: params.id,
      role: body.role,
      content: body.content,
      model: body.model || null,
      routed_to: body.routedTo || null,
      bucket: body.bucket || null,
      used_models: body.usedModels || null,
      usage: body.usage || null,
      responses: body.responses || null,
    })
    .select()
    .single();

  // Update conversation title and timestamp
  if (body.role === 'user' && body.content) {
    const title = body.content.slice(0, 60) + (body.content.length > 60 ? '…' : '');
    await db.from('conversations')
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .catch(() => {});
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: data });
}
