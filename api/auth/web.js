/**
 * api/auth/web.js
 *
 * Web authentication for browser-based clients.
 *
 * POST /api/auth/web?action=login    — sign in with email+password
 * POST /api/auth/web?action=signup   — create account with email+password
 * POST /api/auth/web?action=logout   — client-side token removal
 * GET  /api/auth/web?action=me       — get current user from token
 */

import { createClient } from '@supabase/supabase-js';

function getAnonClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase not configured');
  return createClient(url, key, { auth: { persistSession: false } });
}

export default async function handler(req, res) {
  const { action } = req.query ?? {};

  try {
    // GET /api/auth/web?action=me
    if (req.method === 'GET' && action === 'me') {
      const token = (req.headers.authorization ?? '').replace('Bearer ', '').trim();
      if (!token) return res.status(401).json({ error: 'Not authenticated' });

      const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false },
      });
      const { data: { user }, error } = await client.auth.getUser();
      if (error || !user) return res.status(401).json({ error: 'Invalid session' });

      return res.status(200).json({
        user: { id: user.id, email: user.email, createdAt: user.created_at },
      });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { email, password } = req.body ?? {};

    // POST /api/auth/web?action=signup
    if (action === 'signup') {
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }

      const client = getAnonClient();
      const { data, error } = await client.auth.signUp({ email, password });

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      // Supabase returns session immediately if email confirmation is disabled
      if (data?.session) {
        return res.status(200).json({
          token: data.session.access_token,
          user: { id: data.user.id, email: data.user.email },
        });
      }

      return res.status(200).json({
        message: 'Account created. Check your email for a confirmation link.',
        user: data.user ? { id: data.user.id, email: data.user.email } : null,
      });
    }

    // POST /api/auth/web?action=login
    if (action === 'login') {
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const client = getAnonClient();
      const { data, error } = await client.auth.signInWithPassword({ email, password });

      if (error || !data?.session) {
        return res.status(401).json({ error: error?.message ?? 'Authentication failed' });
      }

      return res.status(200).json({
        token: data.session.access_token,
        user: { id: data.user.id, email: data.user.email },
      });
    }

    // POST /api/auth/web?action=logout
    if (action === 'logout') {
      return res.status(200).json({ message: 'Logged out' });
    }

    return res.status(400).json({ error: 'Unknown action. Use ?action=login, signup, or logout' });
  } catch (err) {
    console.error('[web auth]', err);
    return res.status(500).json({ error: err.message });
  }
}
