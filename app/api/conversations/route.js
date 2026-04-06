import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../lib/supabase/server.js';
import { getUserFromRequest } from '../../../lib/supabase/auth.js';

export async function GET(request) {
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ conversations: [] });

  const user = await getUserFromRequest(request);

  let query = db.from('conversations')
    .select('id, title, created_at, updated_at')
    .order('updated_at', { ascending: false })
    .limit(50);

  if (user) query = query.eq('user_id', user.id);

  const { data, error } = await query;
  return NextResponse.json({ conversations: error ? [] : data });
}

export async function POST(request) {
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });

  const user = await getUserFromRequest(request);
  const { title, workspaceId } = await request.json();

  const { data, error } = await db
    .from('conversations')
    .insert({
      title: title || 'New conversation',
      workspace_id: workspaceId || null,
      user_id: user?.id || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ conversation: data });
}
