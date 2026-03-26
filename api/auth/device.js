/**
 * api/auth/device.js
 *
 * Device authentication for iOS/macOS native clients.
 *
 * POST /api/auth/device  — authenticate with email+password, returns JWT
 * POST /api/auth/device/refresh — refresh an existing device JWT
 * POST /api/auth/device/logout  — invalidate device session (client-side)
 */

import { createClient } from '@supabase/supabase-js';

function getAnonClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase environment variables are not configured');
  return createClient(url, key, { auth: { persistSession: false } });
}

async function signDevice(payload) {
  const secret = process.env.DEVICE_JWT_SECRET;
  if (!secret) throw new Error('DEVICE_JWT_SECRET is not set. Add it to your environment variables.');
  const { default: jwt } = await import('jsonwebtoken');
  return jwt.sign(payload, secret, { expiresIn: '30d' });
}

async function verifyDevice(token) {
  const secret = process.env.DEVICE_JWT_SECRET;
  if (!secret) throw new Error('DEVICE_JWT_SECRET is not set. Add it to your environment variables.');
  const { default: jwt } = await import('jsonwebtoken');
  return jwt.verify(token, secret);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { action } = req.query ?? {};
  const body = req.body ?? {};

  try {
    // POST /api/auth/device/refresh
    if (action === 'refresh') {
      const token = (req.headers.authorization ?? '').replace('Bearer ', '').trim();
      if (!token) return res.status(401).json({ error: 'No token provided' });

      const payload = await verifyDevice(token);
      const newToken = await signDevice({
        sub: payload.sub,
        email: payload.email,
        workspaceId: payload.workspaceId,
        deviceId: payload.deviceId,
      });

      return res.status(200).json({ token: newToken, expiresIn: '30d' });
    }

    // POST /api/auth/device/logout
    if (action === 'logout') {
      // Device tokens are stateless JWTs; the client should delete the token locally.
      // Future: maintain a token denylist in Supabase for immediate revocation.
      return res.status(200).json({ message: 'Logged out. Please delete the token on your device.' });
    }

    // POST /api/auth/device — sign in
    const { email, password, deviceId } = body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const client = getAnonClient();
    const { data, error } = await client.auth.signInWithPassword({ email, password });

    if (error || !data?.user) {
      return res.status(401).json({ error: error?.message ?? 'Authentication failed' });
    }

    const user = data.user;

    // Look up default workspace for this user (first workspace they own or belong to)
    const { getSupabaseAdmin } = await import('../../lib/supabase/server.js');
    const db = getSupabaseAdmin();
    const { data: membership } = await db
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .order('joined_at', { ascending: true })
      .limit(1)
      .single();

    const deviceToken = await signDevice({
      sub: user.id,
      email: user.email,
      workspaceId: membership?.workspace_id ?? null,
      deviceId: deviceId ?? null,
    });

    return res.status(200).json({
      token: deviceToken,
      expiresIn: '30d',
      user: { id: user.id, email: user.email },
      workspaceId: membership?.workspace_id ?? null,
    });
  } catch (err) {
    console.error('[device auth]', err);
    return res.status(500).json({ error: err.message });
  }
}
