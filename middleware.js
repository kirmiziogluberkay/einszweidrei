/**
 * middleware.js
 * iron-session based route protection.
 * Reads the encrypted session cookie to check auth / role.
 */

import { NextResponse }  from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/auth-session';

const PROTECTED_PATHS = ['/myprofile', '/inbox', '/post-ad'];
const ADMIN_PATHS     = ['/admin'];

export async function middleware(request) {
  const response = NextResponse.next({ request });

  // iron-session can read from request.cookies in Edge Runtime
  const session = await getIronSession(request.cookies, sessionOptions);
  const user    = session.user ?? null;

  const { pathname } = request.nextUrl;

  // ── Protected routes ──
  const isProtected = PROTECTED_PATHS.some(p => pathname.startsWith(p));
  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Admin routes ──
  const isAdmin = ADMIN_PATHS.some(p => pathname.startsWith(p));
  if (isAdmin) {
    if (!user)                      return NextResponse.redirect(new URL('/', request.url));
    if (user.role !== 'admin')      return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
