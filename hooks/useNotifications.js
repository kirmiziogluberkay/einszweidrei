/**
 * hooks/useNotifications.js
 * ─────────────────────────────────────────────────────
 * Simple "Has Unread" notification dot hook.
 * ULTRA STABLE Version - No counts, just boolean.
 * ─────────────────────────────────────────────────────
 */

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './useAuth';

export function useNotifications() {
  const { user } = useAuth();
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    if (!user?.id) {
       setHasUnread(false);
       return;
    }

    const supabase = createClient();

    const checkStatus = async () => {
       try {
         const { data, error } = await supabase
           .from('messages')
           .select('id')
           .eq('receiver_id', user.id)
           .eq('is_read', false)
           .limit(1);
         
         if (!error) setHasUnread(data && data.length > 0);
       } catch (err) { }
    };

    checkStatus();

    // Setup channel for immediate updates
    const channel = supabase
       .channel(`status-sync-${user.id}`)
       .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
       }, () => {
          checkStatus();
       })
       .subscribe();

    return () => {
       supabase.removeChannel(channel).catch(() => {});
    };
  }, [user?.id]);

  return { hasUnread };
}
