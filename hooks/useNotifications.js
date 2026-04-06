/**
 * hooks/useNotifications.js
 * ─────────────────────────────────────────────────────
 * Hook to manage real-time unread message notifications.
 * ─────────────────────────────────────────────────────
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './useAuth';

export function useNotifications() {
  const supabase = createClient();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  /** Fetch initial count from database */
  const fetchCount = useCallback(async () => {
    if (!user) return;
    try {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
      setUnreadCount(count || 0);
    } catch (err) {
      console.warn('Error fetching unread count:', err.message);
    }
  }, [user, supabase]);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    // 1. Initial fetch
    fetchCount();

    // 2. Real-time subscription
    // Listening to ALL changes on messages table where I am the receiver.
    // This catches both INSERT (new message) and UPDATE (marked as read).
    const channel = supabase
      .channel(`inbox-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        () => {
          // Re-fetch count immediately when any message I received changes
          fetchCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchCount, supabase]);

  return { 
    unreadCount: typeof unreadCount === 'number' ? unreadCount : 0, 
    refetch: fetchCount 
  };
}
