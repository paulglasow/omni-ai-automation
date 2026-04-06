import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../../lib/supabase/server.js';

/**
 * POST /api/workspaces/[id]/invite — invite a user by email
 */
export async function POST(request, { params }) {
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });

  const { email, role } = await request.json();
  if (!email?.trim()) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

  const validRoles = ['viewer', 'editor', 'admin'];
  const memberRole = validRoles.includes(role) ? role : 'viewer';

  // Look up user by email in profiles table
  const { data: profile } = await db
    .from('profiles')
    .select('id, email')
    .eq('email', email.trim().toLowerCase())
    .single();

  if (!profile) {
    return NextResponse.json({
      error: `No user found with email ${email}. They need to sign in to OmniAI first before they can be invited.`
    }, { status: 404 });
  }

  // Check if already a member
  const { data: existing } = await db
    .from('workspace_members')
    .select('user_id')
    .eq('workspace_id', params.id)
    .eq('user_id', profile.id)
    .single();

  if (existing) {
    return NextResponse.json({ error: 'User is already a member of this workspace' }, { status: 409 });
  }

  // Add as member
  const { data, error } = await db
    .from('workspace_members')
    .insert({
      workspace_id: params.id,
      user_id: profile.id,
      role: memberRole,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    member: {
      userId: profile.id,
      email: profile.email,
      role: memberRole,
    },
    message: `${email} added as ${memberRole}`,
  });
}
