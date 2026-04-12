/**
 * app/auth/callback/route.js
 * ─────────────────────────────────────────────────────
 * Handles Supabase email confirmation redirects.
 * Supabase appends ?code=... to this URL after the user
 * clicks the confirmation link in their email.
 * We exchange that code for a session, then send the
 * user to the homepage.
 * ─────────────────────────────────────────────────────
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code  = searchParams.get('code');
  const next  = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(next, 'https://einszweidrei.vercel.app'));
}
