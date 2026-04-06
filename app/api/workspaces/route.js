import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../lib/supabase/server.js';

/**
 * GET /api/workspaces — list workspaces
 * POST /api/workspaces — create a workspace
 */

export async function GET() {
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ workspaces: [] });

  const { data, error } = await db
    .from('workspaces')
    .select('id, name, description, type, is_public, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[workspaces] GET error:', error);
    return NextResponse.json({ workspaces: [] });
  }

  return NextResponse.json({ workspaces: data });
}

export async function POST(request) {
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });

  const { name, description, type } = await request.json();

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Workspace name is required' }, { status: 400 });
  }

  const { data, error } = await db
    .from('workspaces')
    .insert({
      name: name.trim(),
      description: description || null,
      type: type || 'general',
    })
    .select()
    .single();

  if (error) {
    console.error('[workspaces] POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ workspace: data });
}
