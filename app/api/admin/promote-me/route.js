/**
 * Endpoint to promote the current user to admin.
 * For development purposes.
 */
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-session';
import { readData, writeData } from '@/lib/github-db';

export async function POST() {
  const session = await getSession();
  if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profiles, sha } = await readData('profiles');
  const idx = profiles.findIndex(p => p.id === session.user.id);

  if (idx === -1) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  profiles[idx].role = 'admin';
  await writeData('profiles', profiles, sha);

  // Update session
  session.user.role = 'admin';
  await session.save();

  return NextResponse.json({ ok: true, message: 'You are now an admin. Please refresh the page.' });
}
