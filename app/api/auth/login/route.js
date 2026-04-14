import { NextResponse }   from 'next/server';
import bcrypt             from 'bcryptjs';
import { readData }       from '@/lib/github-db';
import { getSession }     from '@/lib/auth-session';

export async function POST(request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  const { data: profiles } = await readData('profiles');
  const profile = profiles.find(p => p.email?.toLowerCase() === email.trim().toLowerCase());

  if (!profile) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, profile.password_hash);
  if (!valid) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  }

  const session = await getSession();
  session.user  = {
    id:       profile.id,
    username: profile.username,
    email:    profile.email,
    role:     profile.role ?? 'user',
  };
  await session.save();

  return NextResponse.json({ ok: true, user: session.user });
}
