'use client';

import { useState, useEffect } from 'react';
import { useAuth }             from './useAuth';

export function useNotifications() {
  const { user }       = useAuth();
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    if (!user?.id) { setHasUnread(false); return; }

    let cancelled = false;

    const check = async () => {
      try {
        const res  = await fetch('/api/notifications');
        const json = await res.json();
        if (!cancelled) setHasUnread(json.hasUnread ?? false);
      } catch { /* silent */ }
    };

    check();
    const interval = setInterval(check, 30_000); // poll every 30 s

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user?.id]);

  return { hasUnread };
}
