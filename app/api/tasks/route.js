import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../lib/supabase/server.js';

export async function GET() {
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ tasks: [] });

  const { data, error } = await db
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  return NextResponse.json({ tasks: error ? [] : data });
}

export async function POST(request) {
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });

  const { text, priority, dueDate, workspaceId } = await request.json();
  if (!text?.trim()) return NextResponse.json({ error: 'Task text is required' }, { status: 400 });

  const { data, error } = await db
    .from('tasks')
    .insert({
      text: text.trim(),
      priority: priority || 'medium',
      due_date: dueDate || null,
      workspace_id: workspaceId || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ task: data });
}

export async function PATCH(request) {
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });

  const { id, done, text, priority } = await request.json();
  if (!id) return NextResponse.json({ error: 'Task id required' }, { status: 400 });

  const updates = {};
  if (done !== undefined) updates.done = done;
  if (text !== undefined) updates.text = text;
  if (priority !== undefined) updates.priority = priority;

  const { data, error } = await db.from('tasks').update(updates).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ task: data });
}
