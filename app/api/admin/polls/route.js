/**
 * app/api/admin/polls/route.js
 * GET /api/admin/polls — all polls (admin only)
 */

import { NextResponse } from 'next/server';
import { readData }     from '@/lib/github-db';
import { getSession }   from '@/lib/auth-session';

export async function GET() {
  const session = await getSession();
  if (!session.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: polls } = await readData('polls');
  const sorted = (polls ?? []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return NextResponse.json({ polls: sorted });
}
