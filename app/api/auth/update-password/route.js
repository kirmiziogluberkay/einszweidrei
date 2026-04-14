import { NextResponse }          from 'next/server';
import bcrypt                    from 'bcryptjs';
import { readData, writeData }   from '@/lib/github-db';
import { getSession }            from '@/lib/auth-session';

export async function POST(request) {
  const session = await getSession();
  if (!session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { password } = await request.json();

  if (!password || password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
  }

  const { data: profiles, sha } = await readData('profiles');
  const idx = profiles.findIndex(p => p.id === session.user.id);

  if (idx === -1) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  }

  profiles[idx].password_hash = await bcrypt.hash(password, 12);
  await writeData('profiles', profiles, sha);

  return NextResponse.json({ ok: true });
}
