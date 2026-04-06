import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../../lib/supabase/server.js';

/**
 * GET /api/workspaces/[id]/members — list workspace members
 */
export async function GET(request, { params }) {
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ members: [] });

  const { data } = await db
    .from('workspace_members')
    .select('user_id, role, joined_at')
    .eq('workspace_id', params.id);

  return NextResponse.json({ members: data || [] });
}

/**
 * DELETE /api/workspaces/[id]/members — remove a member
 */
export async function DELETE(request, { params }) {
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });

  const { userId } = await request.json();
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

  const { error } = await db
    .from('workspace_members')
    .delete()
    .eq('workspace_id', params.id)
    .eq('user_id', userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
