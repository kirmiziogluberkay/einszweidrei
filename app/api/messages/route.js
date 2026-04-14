/**
 * app/api/messages/route.js
 * GET  /api/messages?adId=&receiverId=  — thread messages
 * POST /api/messages                    — send a message
 * PATCH /api/messages                   — mark thread as read/unread
 * DELETE /api/messages?adId=&otherId=   — delete thread
 */

import { NextResponse }          from 'next/server';
import { randomUUID }            from 'crypto';
import { readData, writeData }   from '@/lib/github-db';
import { getSession }            from '@/lib/auth-session';

// ── GET (thread or inbox) ─────────────────────────────

export async function GET(request) {
  const session = await getSession();
  if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const adId             = searchParams.get('adId');       // thread mode
  const receiverId       = searchParams.get('receiverId'); // thread mode
  const inbox            = searchParams.get('inbox') === '1'; // inbox mode

  const { data: messages }  = await readData('messages');
  const { data: profiles }  = await readData('profiles');
  const { data: ads }       = await readData('ads');
  const uid                 = session.user.id;

  if (inbox) {
    // Return all threads grouped by (ad_id + other user)
    const mine = messages.filter(m => m.sender_id === uid || m.receiver_id === uid);

    const grouped = {};
    mine.forEach(msg => {
      const otherId = msg.sender_id === uid ? msg.receiver_id : msg.sender_id;
      const adKey   = msg.ad_id ?? 'no-ad';
      const key     = `${adKey}_${otherId}`;

      if (!grouped[key]) {
        const other = profiles.find(p => p.id === otherId);
        grouped[key] = {
          key,
          ad_id:       msg.ad_id ?? null,
          otherId,
          otherName:   other?.username ?? 'User',
          lastMessage: msg.content,
          lastTime:    msg.created_at,
          unreadCount: 0,
        };
      }

      if (msg.receiver_id === uid && !msg.is_read) {
        grouped[key].unreadCount++;
      }

      if (new Date(msg.created_at) > new Date(grouped[key].lastTime)) {
        grouped[key].lastMessage = msg.content;
        grouped[key].lastTime    = msg.created_at;
      }
    });

    return NextResponse.json({ threads: Object.values(grouped) });
  }

  // Thread view
  const isNullAd = !adId || adId === 'null' || adId === 'no-ad';
  const thread   = messages.filter(m => {
    const inConversation =
      (m.sender_id === uid && m.receiver_id === receiverId) ||
      (m.receiver_id === uid && m.sender_id === receiverId);

    const adMatch = isNullAd ? !m.ad_id : String(m.ad_id) === String(adId);
    return inConversation && adMatch;
  });

  thread.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  // Join profile data
  const enriched = thread.map(m => {
    const sender   = profiles.find(p => p.id === m.sender_id);
    const receiver = profiles.find(p => p.id === m.receiver_id);
    return {
      ...m,
      sender:   sender   ? { id: sender.id,   username: sender.username   } : null,
      receiver: receiver ? { id: receiver.id, username: receiver.username } : null,
    };
  });

  // Fetch ad info if adId provided
  let adInfo = null;
  if (!isNullAd) {
    adInfo = ads.find(a => a.id === adId) ?? null;
    if (adInfo) adInfo = {
      id: adInfo.id, title: adInfo.title, price: adInfo.price,
      currency: adInfo.currency, images: adInfo.images, serial_number: adInfo.serial_number,
    };
  }

  return NextResponse.json({ messages: enriched, adInfo });
}

// ── POST (send) ───────────────────────────────────────

export async function POST(request) {
  const session = await getSession();
  if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { receiver_id, content, ad_id } = await request.json();

  if (!receiver_id || !content?.trim()) {
    return NextResponse.json({ error: 'receiver_id and content are required.' }, { status: 400 });
  }

  const { data: messages, sha } = await readData('messages');

  const msg = {
    id:          randomUUID(),
    sender_id:   session.user.id,
    receiver_id,
    content:     content.trim(),
    ad_id:       ad_id ?? null,
    is_read:     false,
    created_at:  new Date().toISOString(),
  };

  messages.push(msg);
  await writeData('messages', messages, sha);

  return NextResponse.json({ message: msg }, { status: 201 });
}

// ── PATCH (mark read/unread) ──────────────────────────

export async function PATCH(request) {
  const session = await getSession();
  if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { adId, otherId, is_read } = await request.json();
  const uid = session.user.id;

  const { data: messages, sha } = await readData('messages');
  const isNullAd = !adId || adId === 'null' || adId === 'no-ad';

  let changed = 0;
  messages.forEach((m, i) => {
    const adMatch = isNullAd ? !m.ad_id : String(m.ad_id) === String(adId);
    if (
      m.receiver_id === uid &&
      m.sender_id   === otherId &&
      adMatch
    ) {
      messages[i].is_read = is_read;
      changed++;
    }
  });

  if (changed > 0) await writeData('messages', messages, sha);

  return NextResponse.json({ ok: true, changed });
}

// ── DELETE (thread) ───────────────────────────────────

export async function DELETE(request) {
  const session = await getSession();
  if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const adId    = searchParams.get('adId');
  const otherId = searchParams.get('otherId');
  const uid     = session.user.id;

  const { data: messages, sha } = await readData('messages');
  const isNullAd = !adId || adId === 'null' || adId === 'no-ad';

  const next = messages.filter(m => {
    const adMatch = isNullAd ? !m.ad_id : String(m.ad_id) === String(adId);
    const inThread = (m.sender_id === uid || m.receiver_id === uid) &&
                     (m.sender_id === otherId || m.receiver_id === otherId);
    return !(inThread && adMatch);
  });

  if (next.length < messages.length) {
    await writeData('messages', next, sha);
  }

  return NextResponse.json({ ok: true });
}
