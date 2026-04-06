/**
 * hooks/useNotifications.js
 * ─────────────────────────────────────────────────────
 * Hook to manage real-time unread message notifications.
 * FINAL STABLE VERSION
 * ─────────────────────────────────────────────────────
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './useAuth';

export function useNotifications() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const supabaseRef = useRef(null);

  useEffect(() => {
    if (!user?.id) {
       setUnreadCount(0);
       return;
    }

    // Initialize singleton supabase client for this effect
    if (!supabaseRef.current) {
       supabaseRef.current = createClient();
    }
    const supabase = supabaseRef.current;

    const fetchCount = async () => {
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

    fetchCount();

    // Setup Realtime with stable channel name
    const channelId = `sync-unread-${user.id}`;
    const channel = supabase
       .channel(channelId)
       .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
       }, () => {
          fetchCount();
       })
       .subscribe();

    return () => {
       if (supabase && channel) {
          supabase.removeChannel(channel).catch(() => {});
       }
    };
  }, [user?.id]); // Strictly dependent on User ID only

  return { unreadCount, refetch: () => {} };
}
