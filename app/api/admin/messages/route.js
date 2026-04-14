/**
 * app/api/admin/messages/route.js
 * GET /api/admin/messages            — all messages (admin, paginated)
 * GET /api/admin/messages?feedback=1 — only feedback messages
 */

import { NextResponse }  from 'next/server';
import { readData }      from '@/lib/github-db';
import { getSession }    from '@/lib/auth-session';

export async function GET(request) {
  const session = await getSession();
  if (!session.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const feedback = searchParams.get('feedback') === '1';
  const page     = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit    = Math.min(100, parseInt(searchParams.get('limit') ?? '20', 10));

  const { data: messages }  = await readData('messages');
  const { data: profiles }  = await readData('profiles');
  const { data: ads }       = await readData('ads');

  let all = [...(messages ?? [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  if (feedback) {
    all = all.filter(m => m.content?.startsWith('[FEEDBACK]'));
  }

  const total = all.length;
  const slice = all.slice((page - 1) * limit, page * limit);

  const enriched = slice.map(m => {
    const sender   = profiles.find(p => p.id === m.sender_id);
    const receiver = profiles.find(p => p.id === m.receiver_id);
    const ad       = ads.find(a => a.id === m.ad_id);
    return {
      id:               m.id,
      content:          m.content,
      created_at:       m.created_at,
      is_read:          m.is_read,
      senderUsername:   sender?.username ?? null,
      receiverUsername: receiver?.username ?? null,
      adSerial:         ad?.serial_number ?? null,
      adTitle:          ad?.title ?? null,
    };
  });

  return NextResponse.json({ messages: enriched, total, page, limit });
}
