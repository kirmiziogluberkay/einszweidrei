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
  };

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    // 1. Initial fetch
    fetchCount();

    // 2. Real-time subscription (with safe cleanup)
    let channel = null;

    try {
      channel = supabase
        .channel(`unread-count-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `receiver_id=eq.${user.id}`,
          },
          () => {
            fetchCount();
          }
        )
        .subscribe((status) => {
           if (status === 'CHANNEL_ERROR') {
             console.warn('Realtime channel error for unread count');
           }
        });
    } catch (e) {
      console.error('Realtime subscription failed:', e);
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel).catch(e => console.warn('Channel remove error:', e));
      }
    };
  }, [user]);

  return { 
    unreadCount: typeof unreadCount === 'number' ? unreadCount : 0, 
    refetch: fetchCount 
  };
}
