/**
 * app/api/messages/route.js
 * GET  /api/messages?adId=&receiverId=  — thread messages
 * POST /api/messages                    — send a message
 * PATCH /api/messages                   — mark thread as read/unread
 * DELETE /api/messages?adId=&otherId=   — delete thread
 */

import { NextResponse }          from 'next/server';
import { randomUUID }            from 'crypto';
import { readData }              from '@/lib/github-db';
import { getSession }            from '@/lib/auth-session';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Using Service Role Key to bypass RLS on server

async function supabaseFetch(path, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...(options.headers || {})
    }
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`Supabase error [${options.method || 'GET'} ${url}]:`, text);
    throw new Error(`Supabase error: ${res.status}`);
  }
  
  if (res.status === 204) return [];
  return res.json();
}

// ── GET (thread or inbox) ─────────────────────────────

export async function GET(request) {
  try {
    const session = await getSession();
    if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const adId             = searchParams.get('adId');       // thread mode
    const receiverId       = searchParams.get('receiverId'); // thread mode
    const inbox            = searchParams.get('inbox') === '1'; // inbox mode

    const { data: profiles }  = await readData('profiles');
    const { data: ads }       = await readData('ads');
    const uid                 = session.user.id;

    if (inbox) {
      // Return all threads for the user
      // Query: or=(sender_id.eq.UID,receiver_id.eq.UID)
      const messages = await supabaseFetch(`messages?select=*&or=(sender_id.eq.${uid},receiver_id.eq.${uid})`);

      const mine = messages || [];
      const grouped = {};
      
      mine.forEach(msg => {
        const otherId = msg.sender_id === uid ? msg.receiver_id : msg.sender_id;
        const adKey   = msg.ad_id ?? 'no-ad';
        const key     = `${adKey}_${otherId}`;

        if (!grouped[key]) {
          const other = Array.isArray(profiles) ? profiles.find(p => p.id === otherId) : null;
          grouped[key] = {
            key,
            ad_id:       msg.ad_id ?? null,
            otherId,
            otherName:   other?.username ?? 'Deleted User',
            lastMessage: msg.content ?? '',
            lastTime:    msg.created_at ?? new Date().toISOString(),
            unreadCount: 0,
          };
        }

        if (msg.receiver_id === uid && !msg.is_read) {
          grouped[key].unreadCount++;
        }

        try {
          if (new Date(msg.created_at) > new Date(grouped[key].lastTime)) {
            grouped[key].lastMessage = msg.content;
            grouped[key].lastTime    = msg.created_at;
          }
        } catch (e) {
          // ignore date parse errors
        }
      });

      return NextResponse.json({ threads: Object.values(grouped).sort((a,b) => new Date(b.lastTime) - new Date(a.lastTime)) });
    }

    // Thread view
    const isNullAd = !adId || adId === 'null' || adId === 'no-ad';
    
    // Fetch thread messages
    const adQuery = isNullAd ? 'ad_id=is.null' : `ad_id=eq.${adId}`;
    const usersFilter = `or=(and(sender_id.eq.${uid},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${uid}))`;
    
    let thread = [];
    try {
      thread = await supabaseFetch(`messages?select=*&${adQuery}&${usersFilter}&order=created_at.asc`);
    } catch(e) {
       console.error("Fetch thread error", e);
    }

    // Join profile data
    const enriched = thread.map(m => {
      const sender   = Array.isArray(profiles) ? profiles.find(p => p.id === m.sender_id) : null;
      const receiver = Array.isArray(profiles) ? profiles.find(p => p.id === m.receiver_id) : null;
      return {
        ...m,
        sender:   sender   ? { id: sender.id,   username: sender.username   } : { id: m.sender_id, username: 'User' },
        receiver: receiver ? { id: receiver.id, username: receiver.username } : { id: m.receiver_id, username: 'User' },
      };
    });

    // Fetch ad info if adId provided
    let adInfo = null;
    if (!isNullAd && Array.isArray(ads)) {
      adInfo = ads.find(a => a.id === adId) ?? null;
      if (adInfo) adInfo = {
        id: adInfo.id, title: adInfo.title, price: adInfo.price,
        currency: adInfo.currency, images: adInfo.images, serial_number: adInfo.serial_number,
      };
    }

    return NextResponse.json({ messages: enriched, adInfo });

  } catch (err) {
    console.error('[messages GET] error:', err);
    return NextResponse.json(
      { error: err.message ?? 'An unexpected server error occurred while fetching messages.' },
      { status: 500 }
    );
  }
}

// ── POST (send) ───────────────────────────────────────

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { receiver_id, content, ad_id } = await request.json();

    if (!receiver_id || !content?.trim()) {
      return NextResponse.json({ error: 'receiver_id and content are required.' }, { status: 400 });
    }

    const isNullAd = !ad_id || ad_id === 'null' || ad_id === 'no-ad';
    const finalAdId = isNullAd ? null : ad_id;

    const msg = {
      id:          randomUUID(),
      sender_id:   session.user.id,
      receiver_id,
      content:     content.trim(),
      ad_id:       finalAdId,
      is_read:     false,
      created_at:  new Date().toISOString(),
    };

    const inserted = await supabaseFetch('messages', {
       method: 'POST',
       body: JSON.stringify(msg)
    });

    return NextResponse.json({ message: inserted[0] ?? msg }, { status: 201 });
  } catch (err) {
    console.error('[messages POST] error:', err);
    return NextResponse.json(
      { error: err.message ?? 'An unexpected server error occurred while sending message.' },
      { status: 500 }
    );
  }
}

// ── PATCH (mark read/unread) ──────────────────────────

export async function PATCH(request) {
  try {
    const session = await getSession();
    if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { adId, otherId, is_read } = await request.json();
    const uid = session.user.id;

    const isNullAd = !adId || adId === 'null' || adId === 'no-ad';
    const adQuery = isNullAd ? 'ad_id=is.null' : `ad_id=eq.${adId}`;
    
    const updated = await supabaseFetch(`messages?${adQuery}&receiver_id=eq.${uid}&sender_id=eq.${otherId}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_read })
    });

    return NextResponse.json({ ok: true, changed: updated.length || 0 });
  } catch (err) {
    console.error('[messages PATCH] error:', err);
    return NextResponse.json({ error: 'Server error marking messages as read' }, { status: 500 });
  }
}

// ── DELETE (thread) ───────────────────────────────────

export async function DELETE(request) {
  try {
    const session = await getSession();
    if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const adId    = searchParams.get('adId');
    const otherId = searchParams.get('otherId');
    const uid     = session.user.id;

    const isNullAd = !adId || adId === 'null' || adId === 'no-ad';
    const adQuery = isNullAd ? 'ad_id=is.null' : `ad_id=eq.${adId}`;
    const usersFilter = `or=(and(sender_id.eq.${uid},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${uid}))`;

    await supabaseFetch(`messages?${adQuery}&${usersFilter}`, {
      method: 'DELETE'
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[messages DELETE] error:', err);
    return NextResponse.json({ error: 'Server error deleting thread' }, { status: 500 });
  }
}
