/**
 * lib/auth-session.js
 * ─────────────────────────────────────────────────────
 * iron-session configuration and helpers.
 * Session is stored in an encrypted HTTP-only cookie.
 *
 * Session shape:
 *   { id, username, email, role }
 * ─────────────────────────────────────────────────────
 */

import { getIronSession } from 'iron-session';
import { cookies }        from 'next/headers';

export const SESSION_COOKIE = 'einszweidrei_session';

export const sessionOptions = {
  password:      process.env.SESSION_SECRET ?? 'fallback-secret-change-this-in-production-!!',
  cookieName:    SESSION_COOKIE,
  cookieOptions: {
    secure:   process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge:   60 * 60 * 24 * 7, // 7 days
    path:     '/',
  },
};

/**
 * Returns the iron-session instance backed by the Next.js cookies() store.
 * Works in Server Components, Route Handlers, and Server Actions.
 *
 * @returns {Promise<import('iron-session').IronSession<SessionData>>}
 */
export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession(cookieStore, sessionOptions);
}

/**
 * Returns the logged-in user from the session, or null.
 *
 * @returns {Promise<SessionData|null>}
 */
export async function getSessionUser() {
  const session = await getSession();
  return session.user ?? null;
}
