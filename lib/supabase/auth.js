/**
 * Server-side helper to extract the current user from a request.
 * Reads the Supabase auth cookie or Authorization header.
 */
import { createClient } from '@supabase/supabase-js';

export async function getUserFromRequest(request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  // Try Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const supabase = createClient(url, anonKey);
    const { data: { user } } = await supabase.auth.getUser(token);
    return user;
  }

  // Try cookie-based auth
  const cookies = request.headers.get('cookie') || '';
  const authCookie = cookies.split(';').find((c) => c.trim().includes('-auth-token'));
  if (authCookie) {
    try {
      const tokenPart = authCookie.split('=').slice(1).join('=').trim();
      // Supabase stores tokens in base64 chunks — parse the first chunk
      const decoded = JSON.parse(decodeURIComponent(tokenPart));
      const accessToken = Array.isArray(decoded) ? decoded[0] : decoded?.access_token;
      if (accessToken) {
        const supabase = createClient(url, anonKey);
        const { data: { user } } = await supabase.auth.getUser(accessToken);
        return user;
      }
    } catch {
      // Cookie parsing failed — not fatal
    }
  }

  return null;
}
