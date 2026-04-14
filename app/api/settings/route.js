/**
 * app/api/settings/route.js
 * GET   /api/settings?key=X  — read a setting
 * PUT   /api/settings        — update settings (admin)
 */

import { NextResponse }              from 'next/server';
import { getSettings, saveSettings } from '@/lib/github-db';
import { getSession }                from '@/lib/auth-session';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');

  const settings = await getSettings();

  if (key) {
    return NextResponse.json({ value: settings[key] ?? null });
  }
  return NextResponse.json({ settings });
}

export async function PUT(request) {
  const session = await getSession();
  if (session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const partial  = await request.json();
  const settings = await saveSettings(partial);

  return NextResponse.json({ settings });
}
