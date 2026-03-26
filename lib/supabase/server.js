/**
 * lib/supabase/server.js
 *
 * Server-side Supabase client helpers.
 * Uses the service-role key for privileged operations (never expose to the client).
 */

import { createClient } from '@supabase/supabase-js';

let _client = null;

/**
 * Returns a singleton Supabase client using the service-role key.
 * Must only be used in server-side code (API routes).
 */
export function getSupabaseAdmin() {
  if (_client) return _client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for server-side Supabase access.'
    );
  }

  _client = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return _client;
}

/**
 * Returns a Supabase client scoped to a specific user JWT.
 * Respects Row-Level Security policies.
 *
 * @param {string} userJwt - The Bearer token from the request Authorization header
 */
export function getSupabaseUser(userJwt) {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be set.');
  }

  return createClient(url, anonKey, {
    global: {
      headers: { Authorization: `Bearer ${userJwt}` },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Extract and validate the Bearer JWT from an HTTP Authorization header.
 *
 * @param {string|null} authHeader - The Authorization header value
 * @returns {string} JWT
 * @throws if missing or malformed
 */
export function extractJwt(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header. Expected: Bearer <token>');
  }
  return authHeader.slice('Bearer '.length).trim();
}
