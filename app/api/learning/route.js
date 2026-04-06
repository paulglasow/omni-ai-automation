import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../lib/supabase/server.js';

export async function GET() {
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ topics: [] });

  const { data } = await db.from('learning_topics').select('*').order('created_at', { ascending: false });
  return NextResponse.json({ topics: data || [] });
}

export async function POST(request) {
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });

  const { name, notes } = await request.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Topic name required' }, { status: 400 });

  const { data, error } = await db
    .from('learning_topics')
    .insert({ name: name.trim(), notes: notes || null, progress: 0 })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ topic: data });
}

export async function PATCH(request) {
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });

  const { id, progress, notes } = await request.json();
  if (!id) return NextResponse.json({ error: 'Topic id required' }, { status: 400 });

  const updates = {};
  if (progress !== undefined) updates.progress = Math.min(100, Math.max(0, progress));
  if (notes !== undefined) updates.notes = notes;

  const { data, error } = await db.from('learning_topics').update(updates).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ topic: data });
}
