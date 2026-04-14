/**
 * app/api/polls/[id]/route.js
 * POST /api/polls/:pollId/vote  — increment vote for an option
 * DELETE /api/polls/:pollId     — delete poll (admin)
 */

import { NextResponse }        from 'next/server';
import { readData, writeData } from '@/lib/github-db';
import { getSession }          from '@/lib/auth-session';

export async function POST(request, { params }) {
  const { optionId } = await request.json().catch(() => ({}));
  if (!optionId) return NextResponse.json({ error: 'optionId required' }, { status: 400 });

  const { data: polls, sha } = await readData('polls');
  const poll = polls.find(p => p.id === params.id);
  if (!poll) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const opt = poll.poll_options?.find(o => o.id === optionId);
  if (!opt) return NextResponse.json({ error: 'Option not found' }, { status: 404 });

  opt.votes = (opt.votes ?? 0) + 1;
  await writeData('polls', polls, sha);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request, { params }) {
  const session = await getSession();
  if (!session.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: polls, sha } = await readData('polls');
  const next = polls.filter(p => p.id !== params.id);
  if (next.length < polls.length) await writeData('polls', next, sha);
  return NextResponse.json({ ok: true });
}
