/**
 * app/messages/page.js - REDIRECTING TO /INBOX
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MessagesRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/inbox');
  }, [router]);

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      Redirecting to Inbox...
    </div>
  );
}
