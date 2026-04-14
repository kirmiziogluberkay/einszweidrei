import { NextResponse }       from 'next/server';
import { randomUUID }         from 'crypto';
import bcrypt                 from 'bcryptjs';
import { readData, writeData } from '@/lib/github-db';
import { getSession }          from '@/lib/auth-session';

const RESERVED = new Set([
  'admin','administrator','moderator','mod','support','help',
  'system','root','superuser','staff','team','official',
  'info','contact','noreply','no-reply','mail','email',
  'user','users','account','accounts','profile','profiles',
  'api','dev','developer','test','demo','guest','anonymous',
  'null','undefined','void','true','false',
  'einszweidrei','site','webmaster','postmaster',
]);

export async function POST(request) {
  const { username, email, password } = await request.json();

  // ── Validation ──────────────────────────────────────
  if (!username || !email || !password) {
    return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
  }

  if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
    return NextResponse.json(
      { error: 'Username must be 3-30 characters (letters, numbers, underscores only).' },
      { status: 400 }
    );
  }

  if (RESERVED.has(username.toLowerCase())) {
    return NextResponse.json({ error: 'This username is reserved.' }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
  }

  // ── Uniqueness check ────────────────────────────────
  const { data: profiles, sha } = await readData('profiles');

  if (profiles.find(p => p.email?.toLowerCase() === email.trim().toLowerCase())) {
    return NextResponse.json({ error: 'This email is already registered.' }, { status: 409 });
  }

  if (profiles.find(p => p.username?.toLowerCase() === username.trim().toLowerCase())) {
    return NextResponse.json({ error: 'This username is already taken.' }, { status: 409 });
  }

  // ── Create profile ──────────────────────────────────
  const password_hash = await bcrypt.hash(password, 12);
  const newProfile    = {
    id:            randomUUID(),
    username:      username.trim(),
    email:         email.trim().toLowerCase(),
    password_hash,
    role:          profiles.length === 0 ? 'admin' : 'user', // first user becomes admin
    phone:         null,
    avatar_url:    null,
    created_at:    new Date().toISOString(),
  };

  profiles.push(newProfile);
  await writeData('profiles', profiles, sha);

  // ── Auto-login after register ───────────────────────
  const session  = await getSession();
  session.user   = {
    id:       newProfile.id,
    username: newProfile.username,
    email:    newProfile.email,
    role:     newProfile.role,
  };
  await session.save();

  return NextResponse.json({ ok: true, user: session.user }, { status: 201 });
}
