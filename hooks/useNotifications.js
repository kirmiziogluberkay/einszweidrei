/**
 * hooks/useNotifications.js
 * ─────────────────────────────────────────────────────
 * Hook to manage real-time unread message notifications.
 * ─────────────────────────────────────────────────────
 */

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './useAuth';

export function useNotifications() {
  const supabase = createClient();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  /** Fetch initial count */
  const fetchCount = async () => {
    if (!user) return;
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', user.id)
      .eq('is_read', false);

    if (!error) {
      setUnreadCount(count || 0);
    }
  };

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    fetchCount();

    /** Subscribe to real-time changes in messages table */
    const channel = supabase
      .channel(`unread-count-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT (new msg) and UPDATE (marked as read)
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        () => {
          // Re-fetch count immediately on any change for this user
          fetchCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { unreadCount, refetch: fetchCount };
}
