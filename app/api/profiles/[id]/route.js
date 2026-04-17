/**
 * app/api/profiles/[id]/route.js
 * GET /api/profiles/:id       — public profile
 * GET /api/profiles/by-username?username=X
 * PUT /api/profiles/:id       — update own profile
 */

import { NextResponse }          from 'next/server';
import { readData, writeData }   from '@/lib/github-db';
import { getSession }            from '@/lib/auth-session';

export async function GET(request, { params }) {
  const { searchParams } = new URL(request.url);
  const usernameQuery    = searchParams.get('username');

  const { data: profiles } = await readData('profiles');

  let profile;
  if (usernameQuery) {
    profile = profiles.find(p => p.username?.toLowerCase() === usernameQuery.toLowerCase());
  } else {
    profile = profiles.find(p => p.id === params.id);
  }

  if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Never return password_hash
  const { password_hash, ...safe } = profile;
  return NextResponse.json({ profile: safe });
}

export async function PUT(request, { params }) {
  const session = await getSession();
  if (!session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isOwner = session.user.id === params.id;
  const isAdmin = session.user.role === 'admin';
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { data: profiles, sha } = await readData('profiles');
  const idx = profiles.findIndex(p => p.id === params.id);

  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Only allow safe fields to be updated
  const allowed = ['username', 'phone', 'avatar_url'];
  if (isAdmin) allowed.push('role', 'status');

  for (const key of allowed) {
    if (key in body) profiles[idx][key] = body[key];
  }

  await writeData('profiles', profiles, sha);

  // Update session if own profile
  if (isOwner) {
    session.user = {
      ...session.user,
      username: profiles[idx].username,
    };
    await session.save();
  }

  const { password_hash, ...safe } = profiles[idx];
  return NextResponse.json({ profile: safe });
}
