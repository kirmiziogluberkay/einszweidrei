/**
 * app/api/notifications/route.js
 * GET /api/notifications — returns { hasUnread: boolean }
 */

import { NextResponse } from 'next/server';
import { readData }     from '@/lib/github-db';
import { getSession }   from '@/lib/auth-session';

export async function GET() {
  const session = await getSession();
  if (!session.user) return NextResponse.json({ hasUnread: false });

  const { data: messages } = await readData('messages');
  const hasUnread = messages.some(
    m => m.receiver_id === session.user.id && !m.is_read
  );

  return NextResponse.json({ hasUnread });
}
