/**
 * app/auth/callback/route.js
 * Supabase email callback route — no longer needed.
 * Redirects to home page.
 */
import { NextResponse } from 'next/server';

export function GET(request) {
  const next = new URL(request.url).searchParams.get('next') ?? '/';
  return NextResponse.redirect(new URL(next, request.url));
}
