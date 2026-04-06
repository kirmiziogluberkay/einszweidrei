/**
 * hooks/useNotifications.js
 * ─────────────────────────────────────────────────────
 * Hook to manage real-time unread message notifications.
 * Hardened version to prevent infinite render loops.
 * ─────────────────────────────────────────────────────
 */

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './useAuth';

export function useNotifications() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    // 1. Stable client for this specific effect
    const supabase = createClient();

    const fetchInternal = async () => {
      try {
        const { count, error } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('receiver_id', user.id)
          .eq('is_read', false);
        
        if (!error) setUnreadCount(count || 0);
      } catch (err) {
        console.warn('Silent fetch error:', err.message);
      }
    };

    // Initial fetch
    fetchInternal();

    // 2. Real-time subscription (Stable channel)
    const channel = supabase
      .channel(`inbox-sync-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        () => {
          fetchInternal();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel).catch(() => {});
    };
  }, [user?.id]); // Only re-run if USER ID changes, NOT the user object itself

  return { 
    unreadCount: typeof unreadCount === 'number' ? unreadCount : 0,
    refetch: () => {
       // Manual trigger support
       const s = createClient();
       s.from('messages').select('*', { count: 'exact', head: true })
        .eq('receiver_id', user?.id).eq('is_read', false)
        .then(({ count }) => count !== undefined && setUnreadCount(count || 0));
    }
  };
}
