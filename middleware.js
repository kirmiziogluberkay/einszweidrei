/**
 * middleware.js
 * ─────────────────────────────────────────────────────
 * Next.js Edge Middleware — Server-side route protection.
 *
 * - Refreshes Supabase session cookies on every request.
 * - Redirects unauthenticated users away from protected routes.
 * - Redirects non-admin users away from /admin routes.
 * ─────────────────────────────────────────────────────
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

/** Routes that require a logged-in user */
const PROTECTED_PATHS = ['/myprofile', '/inbox', '/ilan-ver', '/post-ad'];

/** Routes that require admin role */
const ADMIN_PATHS = ['/admin'];

export async function middleware(request) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — keeps access token alive
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // ── Protected routes: login required ──
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Admin routes: admin role required ──
  const isAdmin = ADMIN_PATHS.some((p) => pathname.startsWith(p));
  if (isAdmin) {
    if (!user) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     *   - _next/static  (static files)
     *   - _next/image   (image optimization)
     *   - favicon.ico
     *   - public assets (images, svg, etc.)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
