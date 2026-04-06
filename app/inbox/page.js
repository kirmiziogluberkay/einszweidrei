/**
 * app/inbox/page.js
 * ─────────────────────────────────────────────────────
 * Gelen kutusu ve mesajlaşma merkezi.
 * Phase 5: Conversation Deletion Support
 * ─────────────────────────────────────────────────────
 */

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { timeAgo, truncateText, formatUsername } from '@/lib/helpers';
import MessageThread from '@/components/messages/MessageThread';
import { Trash2, AlertCircle, MessageSquare } from 'lucide-react';

export default function InboxPage() {
  const supabase = createClient();
  const { user, authLoading } = useAuth();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeThread, setActiveThread] = useState(null);

  /**
   * Tüm konuşmaları (thread) çek.
   */
  const fetchThreads = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const grouped = {};
      messages.forEach(msg => {
        const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        const key = `${msg.ad_id}_${otherId}`;

        if (!grouped[key]) {
          grouped[key] = {
            key,
            ad_id: msg.ad_id,
            otherId,
            lastMessage: msg.content,
            lastTime: msg.created_at,
            unreadCount: 0,
            otherName: 'User'
          };
        }

        if (msg.receiver_id === user.id && !msg.is_read) {
          grouped[key].unreadCount++;
        }
      });

      const threadsArr = Object.values(grouped);
      const profileIds = [...new Set(threadsArr.map(t => t.otherId))];

      if (profileIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', profileIds);

        profiles?.forEach(p => {
          threadsArr.forEach(t => {
            if (t.otherId === p.id) t.otherName = p.username;
          });
        });
      }

      setThreads(threadsArr);
    } catch (err) {
      console.error('Fetch threads error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchThreads();
    }
  }, [user, authLoading]);

  // Real-time sync for Inbox list
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`inbox-sync-list-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` }, () => {
        fetchThreads();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel).catch(() => {}); };
  }, [user?.id]);

  /**
   * Sohbeti Sil
   */
  const handleDeleteThread = async (adId, otherId) => {
    if (!confirm('Are you sure you want to delete this conversation? This will clear all messages.')) return;

    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('ad_id', adId)
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${user.id})`);

      if (error) throw error;
      
      // Update local state
      setThreads(prev => prev.filter(t => t.ad_id !== adId || t.otherId !== otherId));
      if (activeThread?.ad_id === adId && activeThread?.otherId === otherId) {
        setActiveThread(null);
      }
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const handleSelectThread = (thread) => {
    setActiveThread(thread);
    setThreads(prev => prev.map(t => t.key === thread.key ? { ...t, unreadCount: 0 } : t));
  };

  if (authLoading || loading) return <div className="container-app py-12 text-center text-ink-tertiary">Loading inbox...</div>;
  if (!user) return <div className="container-app py-12 text-center">Please login to view your messages.</div>;

  return (
    <div className="container-app py-8">
      <h1 className="text-2xl font-black text-ink mb-8">Messages</h1>

      {threads.length === 0 ? (
        <div className="card p-12 text-center flex flex-col items-center gap-4">
          <MessageSquare className="w-12 h-12 text-surface-tertiary" />
          <p className="text-ink-tertiary font-medium">Your inbox is empty.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[75vh] min-h-[600px]">
          {/* Conversatıons Sidebar */}
          <div className="md:col-span-1 card overflow-hidden flex flex-col bg-white">
            <div className="p-4 border-b border-surface-tertiary bg-surface-secondary/20">
              <h2 className="font-bold text-ink text-sm">Conversations</h2>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-surface-tertiary">
              {threads.map((thread) => (
                <div
                  key={thread.key}
                  className={`relative group cursor-pointer p-4 hover:bg-surface-secondary transition-all border-l-4 ${
                    activeThread?.key === thread.key ? 'bg-surface-secondary border-brand-500' : 'border-transparent'
                  } ${thread.unreadCount > 0 ? 'bg-brand-50 font-black shadow-sm' : 'bg-white font-normal'}`}
                  onClick={() => handleSelectThread(thread)}
                >
                  {thread.unreadCount > 0 && (
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full shadow-sm" />
                  )}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-12 h-12 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-sm font-bold flex-shrink-0 border-2 border-white shadow-sm">
                        {thread.otherName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1 mb-0.5">
                          <p className={`text-sm truncate ${thread.unreadCount > 0 ? "font-black text-ink" : "font-semibold text-ink-secondary"}`}>
                            {formatUsername(thread.otherName)}
                          </p>
                        </div>
                        <p className={`text-xs truncate ${thread.unreadCount > 0 ? "text-brand-700 font-bold" : "text-ink-tertiary font-medium"}`}>
                          {truncateText(thread.lastMessage || "", 40)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                       <span className="text-[10px] text-ink-tertiary whitespace-nowrap">{timeAgo(thread.lastTime)}</span>
                       <button 
                         onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteThread(thread.ad_id, thread.otherId);
                         }}
                         className="p-1.5 text-ink-tertiary hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                       >
                          <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Thread */}
          <div className="md:col-span-2 card overflow-hidden flex flex-col bg-white">
            {activeThread ? (
              <MessageThread adId={activeThread.ad_id} receiverId={activeThread.otherId} />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-ink-tertiary gap-4">
                <div className="w-16 h-16 rounded-full bg-surface-secondary flex items-center justify-center">
                   <MessageSquare className="w-8 h-8 opacity-20" />
                </div>
                <p className="font-medium">Select a conversation to start messaging</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
