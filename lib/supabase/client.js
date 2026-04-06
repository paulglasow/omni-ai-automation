/**
 * Browser-side Supabase client.
 * Only uses NEXT_PUBLIC_ variables — safe for the browser.
 */
import { createClient } from '@supabase/supabase-js';

let _client = null;

export function getSupabase() {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return null;

  _client = createClient(url, anonKey);
  return _client;
}

/**
 * Get the current logged-in user (or null).
 */
export async function getCurrentUser() {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Sign in with Google OAuth.
 */
export async function signInWithGoogle() {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not configured');

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) throw error;
}

/**
 * Sign out.
 */
export async function signOut() {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.auth.signOut();
  window.location.href = '/login';
}
