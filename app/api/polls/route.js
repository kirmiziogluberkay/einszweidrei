/**
 * app/api/polls/route.js
 * GET  /api/polls             — active poll (public)
 * POST /api/polls             — create poll (admin)
 * PUT  /api/polls             — set active poll / toggle polls_enabled (admin)
 */

import { NextResponse }        from 'next/server';
import { randomUUID }          from 'crypto';
import { readData, writeData, getSettings, saveSettings } from '@/lib/github-db';
import { getSession }          from '@/lib/auth-session';

export async function GET() {
  const settings   = await getSettings();
  const enabled    = settings?.polls_enabled !== false;

  if (!enabled) return NextResponse.json({ poll: null });

  const { data: polls } = await readData('polls');
  const active = (polls ?? []).find(p => p.is_active);
  return NextResponse.json({ poll: active ?? null, polls_enabled: enabled });
}

export async function POST(request) {
  const session = await getSession();
  if (!session.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { question, options } = body;

  if (!question?.trim() || !Array.isArray(options) || options.filter(o => o.trim()).length < 2) {
    return NextResponse.json({ error: 'question and at least 2 options are required.' }, { status: 400 });
  }

  const { data: polls, sha } = await readData('polls');

  const poll = {
    id:          randomUUID(),
    question:    question.trim(),
    is_active:   false,
    created_at:  new Date().toISOString(),
    poll_options: options.filter(o => o.trim()).map(o => ({
      id:          randomUUID(),
      option_text: o.trim(),
      votes:       0,
    })),
  };

  polls.push(poll);
  await writeData('polls', polls, sha);
  return NextResponse.json({ poll }, { status: 201 });
}

export async function PUT(request) {
  const session = await getSession();
  if (!session.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();

  // Toggle polls_enabled globally
  if ('polls_enabled' in body) {
    await saveSettings({ polls_enabled: body.polls_enabled });
    return NextResponse.json({ ok: true });
  }

  // Set a specific poll as active
  if (body.activePollId !== undefined) {
    const { data: polls, sha } = await readData('polls');
    polls.forEach(p => { p.is_active = p.id === body.activePollId; });
    await writeData('polls', polls, sha);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
}
