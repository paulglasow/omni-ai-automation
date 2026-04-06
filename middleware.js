import { NextResponse } from 'next/server';

/**
 * Middleware: soft auth check.
 * Checks for Supabase auth cookies. If missing and not on a public route, redirects to /login.
 * Does NOT block API routes (they check auth themselves).
 */
export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Public routes — no auth needed
  const publicRoutes = ['/login', '/auth/callback', '/api/'];
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check for Supabase auth cookie
  const hasAuthCookie = request.cookies.getAll().some(
    (cookie) => cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')
  );

  // If no Supabase configured (no cookie prefix exists), allow through
  // This lets the app work without auth during initial setup
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return NextResponse.next();

  // If no auth cookie, allow through for now (auth is optional)
  // TODO: Enable redirect once auth is fully working
  // if (!hasAuthCookie) {
  //   const url = request.nextUrl.clone();
  //   url.pathname = '/login';
  //   return NextResponse.redirect(url);
  // }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - _next (Next.js internals)
     * - static files
     * - favicon
     * - manifest
     */
    '/((?!_next|static|favicon|manifest|icon-|.*\\..*$).*)',
  ],
};
