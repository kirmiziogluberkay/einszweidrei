import { NextResponse }        from 'next/server';
import bcrypt                  from 'bcryptjs';
import { readData, writeData } from '@/lib/github-db';

export async function POST(request) {
  const { token, password } = await request.json();

  if (!token || !password) {
    return NextResponse.json({ error: 'Token and password are required.' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
  }

  const { data: profiles, sha } = await readData('profiles');
  const idx = profiles.findIndex(
    p => p.reset_token === token && p.reset_token_expires > Date.now()
  );

  if (idx === -1) {
    return NextResponse.json({ error: 'Invalid or expired reset link. Please request a new one.' }, { status: 400 });
  }

  profiles[idx].password_hash        = await bcrypt.hash(password, 12);
  profiles[idx].reset_token          = null;
  profiles[idx].reset_token_expires  = null;
  await writeData('profiles', profiles, sha);

  return NextResponse.json({ ok: true });
}
