import { NextResponse }    from 'next/server';
import { getSession }      from '@/lib/auth-session';
import { readData }        from '@/lib/github-db';

export async function GET() {
  const session = await getSession();
  if (!session.user) {
    return NextResponse.json({ user: null });
  }

  // Return fresh profile data from DB
  const { data: profiles } = await readData('profiles');
  const profile = profiles.find(p => p.id === session.user.id);

  if (!profile) {
    session.destroy();
    return NextResponse.json({ user: null });
  }

  const user = {
    id:         profile.id,
    username:   profile.username,
    email:      profile.email,
    role:       profile.role,
    phone:      profile.phone ?? null,
    avatar_url: profile.avatar_url ?? null,
  };

  // Keep session in sync with latest profile data
  session.user = { id: user.id, username: user.username, email: user.email, role: user.role };
  await session.save();

  return NextResponse.json({ user });
}
