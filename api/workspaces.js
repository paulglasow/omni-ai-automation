/**
 * api/workspaces.js
 *
 * Workspace CRUD and invite endpoints.
 *
 * Routes (resolved via Vercel serverless routing or Express-style middleware):
 *   GET  /api/workspaces                 — list user's workspaces
 *   POST /api/workspaces                 — create workspace
 *   GET  /api/workspaces/:id             — get workspace details
 *   DELETE /api/workspaces/:id           — delete workspace (owner only)
 *   POST /api/workspaces/:id/invite      — invite member by email
 *   GET  /api/workspaces/:id/members     — list members
 *   DELETE /api/workspaces/:id/members/:userId — remove member
 */

import { getSupabaseAdmin, extractJwt } from '../lib/supabase/server.js';
import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Auth helper — resolves the caller's user_id from their JWT
// ---------------------------------------------------------------------------

async function resolveUser(authHeader) {
  const jwt = extractJwt(authHeader);
  const client = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
      auth: { persistSession: false },
    }
  );
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) throw new Error('Unauthorized');
  return { user, jwt };
}

// ---------------------------------------------------------------------------
// Invite signing
// ---------------------------------------------------------------------------

async function signInviteToken(payload) {
  const secret = process.env.WORKSPACE_INVITE_SECRET;
  if (!secret) throw new Error('WORKSPACE_INVITE_SECRET not set');
  const { default: jwt } = await import('jsonwebtoken');
  return jwt.sign(payload, secret, { expiresIn: '24h' });
}

async function verifyInviteToken(token) {
  const secret = process.env.WORKSPACE_INVITE_SECRET;
  if (!secret) throw new Error('WORKSPACE_INVITE_SECRET not set');
  const { default: jwt } = await import('jsonwebtoken');
  return jwt.verify(token, secret);
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

async function listWorkspaces(userId) {
  const db = getSupabaseAdmin();
  // Fetch workspaces where user is a member (covers editors, viewers, and admins)
  const { data: memberWorkspaces, error: memberErr } = await db
    .from('workspace_members')
    .select('workspace_id, role, workspaces(id, name, owner_id, is_public, created_at)')
    .eq('user_id', userId);

  if (memberErr) throw memberErr;

  // Also include workspaces where user is the owner but not yet explicitly in workspace_members
  const memberWorkspaceIds = (memberWorkspaces ?? []).map((m) => m.workspace_id);
  const { data: ownedWorkspaces, error: ownedErr } = await db
    .from('workspaces')
    .select('id, name, owner_id, is_public, created_at')
    .eq('owner_id', userId)
    .not('id', 'in', memberWorkspaceIds.length ? `(${memberWorkspaceIds.join(',')})` : '(null)');

  if (ownedErr) throw ownedErr;

  const fromMembership = (memberWorkspaces ?? []).map((m) => ({
    ...m.workspaces,
    role: m.role,
  }));
  const fromOwned = (ownedWorkspaces ?? []).map((ws) => ({ ...ws, role: 'admin' }));

  return [...fromMembership, ...fromOwned];
}

async function createWorkspace(userId, { name, isPublic = false }) {
  if (!name?.trim()) throw new Error('name is required');
  const db = getSupabaseAdmin();

  const { data: ws, error: wsErr } = await db
    .from('workspaces')
    .insert({ name: name.trim(), owner_id: userId, is_public: isPublic })
    .select()
    .single();

  if (wsErr) throw wsErr;

  // Auto-add owner as admin member
  await db.from('workspace_members').insert({
    workspace_id: ws.id,
    user_id: userId,
    role: 'admin',
  });

  return ws;
}

async function getWorkspace(workspaceId, userId) {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('workspaces')
    .select(`
      id, name, owner_id, is_public, created_at,
      workspace_members(user_id, role)
    `)
    .eq('id', workspaceId)
    .single();

  if (error) throw error;
  if (!data) throw new Error('Workspace not found');

  const isMember = data.workspace_members?.some((m) => m.user_id === userId);
  if (!data.is_public && !isMember) throw new Error('Forbidden');

  return data;
}

async function deleteWorkspace(workspaceId, userId) {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('workspaces')
    .select('owner_id')
    .eq('id', workspaceId)
    .single();

  if (error || !data) throw new Error('Workspace not found');
  if (data.owner_id !== userId) throw new Error('Only the owner can delete a workspace');

  await db.from('workspaces').delete().eq('id', workspaceId);
}

async function inviteMember(workspaceId, userId, { email, role = 'viewer' }) {
  if (!email?.includes('@')) throw new Error('Valid email is required');
  if (!['viewer', 'editor', 'admin'].includes(role)) throw new Error('Invalid role');

  const db = getSupabaseAdmin();

  // Verify caller is admin or owner
  const { data: member } = await db
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .single();

  if (!member || !['admin'].includes(member.role)) {
    // Also allow workspace owner even if not in members table
    const { data: ws } = await db
      .from('workspaces')
      .select('owner_id')
      .eq('id', workspaceId)
      .single();
    if (!ws || ws.owner_id !== userId) throw new Error('Forbidden: admin role required');
  }

  const token = await signInviteToken({ workspaceId, email, role });

  await db.from('workspace_invites').insert({
    workspace_id: workspaceId,
    invited_email: email,
    role,
    token,
  });

  return { token, expiresIn: '24h', message: `Invite sent to ${email}` };
}

async function acceptInvite(token, userId, userEmail) {
  const payload = await verifyInviteToken(token);
  const db = getSupabaseAdmin();

  if (payload.email.toLowerCase() !== userEmail.toLowerCase()) {
    throw new Error('This invite was sent to a different email address');
  }

  const { data: invite } = await db
    .from('workspace_invites')
    .select('id, workspace_id, role')
    .eq('token', token)
    .single();

  if (!invite) throw new Error('Invite not found or already used');

  await db.from('workspace_members').upsert({
    workspace_id: invite.workspace_id,
    user_id: userId,
    role: invite.role,
  });

  await db.from('workspace_invites').delete().eq('id', invite.id);

  return { workspaceId: invite.workspace_id, role: invite.role };
}

async function listMembers(workspaceId, userId) {
  await getWorkspace(workspaceId, userId); // authorization check
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('workspace_members')
    .select('user_id, role, joined_at')
    .eq('workspace_id', workspaceId);
  if (error) throw error;
  return data ?? [];
}

async function removeMember(workspaceId, requesterId, targetUserId) {
  const db = getSupabaseAdmin();

  // Only admins or the user themselves can remove a member
  const { data: ws } = await db
    .from('workspaces')
    .select('owner_id')
    .eq('id', workspaceId)
    .single();

  const { data: requesterMember } = await db
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', requesterId)
    .single();

  const isOwner = ws?.owner_id === requesterId;
  const isAdmin = requesterMember?.role === 'admin';
  const isSelf = requesterId === targetUserId;

  if (!isOwner && !isAdmin && !isSelf) throw new Error('Forbidden');
  if (ws?.owner_id === targetUserId) throw new Error('Cannot remove the workspace owner');

  await db
    .from('workspace_members')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('user_id', targetUserId);
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

export default async function handler(req, res) {
  let user;
  try {
    ({ user } = await resolveUser(req.headers.authorization));
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { method, query, body } = req;
  const { id: workspaceId, action } = query ?? {};

  try {
    // POST /api/workspaces/accept-invite
    if (method === 'POST' && action === 'accept-invite') {
      const result = await acceptInvite(body?.token, user.id, user.email);
      return res.status(200).json(result);
    }

    // GET /api/workspaces
    if (method === 'GET' && !workspaceId) {
      const workspaces = await listWorkspaces(user.id);
      return res.status(200).json({ workspaces });
    }

    // POST /api/workspaces
    if (method === 'POST' && !workspaceId) {
      const ws = await createWorkspace(user.id, body ?? {});
      return res.status(201).json(ws);
    }

    if (!workspaceId) {
      return res.status(400).json({ error: 'workspaceId required' });
    }

    // GET /api/workspaces/:id
    if (method === 'GET' && !action) {
      const ws = await getWorkspace(workspaceId, user.id);
      return res.status(200).json(ws);
    }

    // DELETE /api/workspaces/:id
    if (method === 'DELETE' && !action) {
      await deleteWorkspace(workspaceId, user.id);
      return res.status(200).json({ deleted: true });
    }

    // POST /api/workspaces/:id/invite
    if (method === 'POST' && action === 'invite') {
      const result = await inviteMember(workspaceId, user.id, body ?? {});
      return res.status(200).json(result);
    }

    // GET /api/workspaces/:id/members
    if (method === 'GET' && action === 'members') {
      const members = await listMembers(workspaceId, user.id);
      return res.status(200).json({ members });
    }

    // DELETE /api/workspaces/:id/members/:targetUserId
    if (method === 'DELETE' && action === 'members') {
      const { targetUserId } = body ?? {};
      if (!targetUserId) return res.status(400).json({ error: 'targetUserId required' });
      await removeMember(workspaceId, user.id, targetUserId);
      return res.status(200).json({ removed: true });
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (err) {
    const status = err.message === 'Forbidden' ? 403
      : err.message === 'Unauthorized' ? 401
      : err.message?.includes('not found') ? 404
      : 500;
    return res.status(status).json({ error: err.message });
  }
}
