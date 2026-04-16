/**
 * app/api/notifications/route.js
 * GET /api/notifications — returns { hasUnread: boolean }
 */

import { NextResponse } from 'next/server';
import { getSession }   from '@/lib/auth-session';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET() {
  try {
    const session = await getSession();
    if (!session.user) return NextResponse.json({ hasUnread: false });
    
    const uid = session.user.id;

    const res = await fetch(`${SUPABASE_URL}/rest/v1/messages?select=id&receiver_id=eq.${uid}&is_read=eq.false&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (res.ok) {
        if (res.status === 204) {
             return NextResponse.json({ hasUnread: false });
        }
        const messages = await res.json();
        return NextResponse.json({ hasUnread: messages.length > 0 });
    }
    
    return NextResponse.json({ hasUnread: false });
  } catch(e) {
      console.error("[notifications GET] Error:", e);
      return NextResponse.json({ hasUnread: false });
  }
}
