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

export async function DELETE(request, { params }) {
  try {
    const session = await getSession();
    if (!session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Admin only' }, { status: 403 });
    }

    if (session.user.id === params.id) {
      return NextResponse.json({ error: 'You cannot delete your own admin account.' }, { status: 400 });
    }

    const { data: profiles, sha: pSha } = await readData('profiles');
    const nextProfiles = profiles.filter(p => p.id !== params.id);

    if (nextProfiles.length === profiles.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Cascade: delete user's ads
    try {
      const { data: ads, sha: aSha } = await readData('ads');
      const nextAds = ads.filter(a => a.owner_id !== params.id);
      if (nextAds.length !== ads.length) await writeData('ads', nextAds, aSha);
    } catch (e) { console.error('Failed to cascade delete ads', e); }

    // Cascade: delete user's messages
    try {
      const { data: messages, sha: mSha } = await readData('messages');
      const nextMessages = messages.filter(m => m.sender_id !== params.id && m.receiver_id !== params.id);
      if (nextMessages.length !== messages.length) await writeData('messages', nextMessages, mSha);
    } catch (e) { console.error('Failed to cascade delete messages', e); }

    // Finally delete profile
    await writeData('profiles', nextProfiles, pSha);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: 'An error occurred during deletion.' }, { status: 500 });
  }
}

