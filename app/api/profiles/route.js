/**
 * app/api/profiles/route.js
 * GET /api/profiles?role=admin  — list profiles (public, strips password_hash)
 */

import { NextResponse }  from 'next/server';
import { readData }      from '@/lib/github-db';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const role  = searchParams.get('role');
  const limit = parseInt(searchParams.get('limit') ?? '50', 10);

  const { data: profiles } = await readData('profiles');

  let result = profiles ?? [];
  if (role) result = result.filter(p => p.role === role);
  result = result.slice(0, limit);

  // Strip sensitive fields — email and phone are private
  const safe = result.map(({ password_hash, email, phone, ...p }) => p);
  return NextResponse.json(safe);
}
