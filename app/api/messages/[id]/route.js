/**
 * app/api/messages/[id]/route.js
 * DELETE /api/messages/:id — delete a single message (sender only)
 */

import { NextResponse }        from 'next/server';
import { readData, writeData } from '@/lib/github-db';
import { getSession }          from '@/lib/auth-session';

export async function DELETE(request, { params }) {
  const session = await getSession();
  if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id }  = params;
  const uid     = session.user.id;

  const { data: messages, sha } = await readData('messages');

  const msg = messages.find(m => m.id === id);
  if (!msg) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (msg.sender_id !== uid) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const next = messages.filter(m => m.id !== id);
  await writeData('messages', next, sha);

  return NextResponse.json({ ok: true });
}
