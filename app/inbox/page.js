/**
 * app/inbox/page.js
 * ─────────────────────────────────────────────────────
 * Mesaj kutusu — kullanıcının tüm konuşmaları.
 * ─────────────────────────────────────────────────────
 */

'use client';

import { useState, useEffect } from 'react';
import { Loader2, Trash2, MessageSquareOff, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import MessageThread from '@/components/messages/MessageThread';
import { useNotifications } from '@/hooks/useNotifications';
import { timeAgo, truncateText, formatUsername } from '@/lib/helpers';


export default function InboxPage() {
  const supabase = createClient();
  const { user, loading: authLoading } = useAuth();
  const notifications = useNotifications();
  const refetchNotifications = notifications?.refetch;

  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeThread, setActiveThread] = useState(null);

  const handleSelectThread = (thread) => {
    setActiveThread(thread);
    // Clear unread count locally for instant feedback
    setThreads(prev => prev.map(t => 
      t.key === thread.key ? { ...t, unreadCount: 0 } : t
    ));
    if (typeof refetchNotifications === 'function') {
      setTimeout(() => refetchNotifications(), 500);
    }
  };

  const fetchThreads = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select(`
          id, content, created_at, is_read,
          sender:profiles!sender_id(id, username),
          receiver:profiles!receiver_id(id, username),
          ad:ads!ad_id(id, serial_number, title)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (msgError) throw msgError;

      const threadMap = {};
      (messages || []).forEach((msg) => {
        if (!msg.ad) return;

        const otherUser = msg.sender?.id === user.id ? msg.receiver : msg.sender;
        if (!otherUser) return;

        const otherId     = otherUser.id;
        const otherName   = otherUser.username || 'Unknown User';
        
        const key = `${msg.ad.id}_${otherId}`;

        if (!threadMap[key]) {
          threadMap[key] = {
            key,
            adId:        msg.ad.id,
            adTitle:     msg.ad.title,
            serialNumber:msg.ad.serial_number,
            otherId,
            otherName,
            lastMessage: msg.content || '',
            lastTime:    msg.created_at,
            unreadCount: (!msg.is_read && msg.receiver?.id === user.id) ? 1 : 0,
          };
        } else if (!msg.is_read && msg.receiver?.id === user.id) {
          threadMap[key].unreadCount += 1;
        }
      });

      setThreads(Object.values(threadMap));
    } catch (err) {
      console.error('Error fetching threads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchThreads();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const handleDeleteThread = async (adId, otherId) => {
    if (!confirm('Are you sure you want to delete this chat?')) return;

    await supabase
      .from('messages')
      .delete()
      .eq('ad_id', adId)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

    setThreads((prev) =>
      prev.filter((t) => !(t.adId === adId && t.otherId === otherId))
    );
    if (activeThread?.adId === adId && activeThread?.otherId === otherId) {
      setActiveThread(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          <p className="text-xs text-ink-tertiary font-medium">Loading conversations...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container-app py-16 text-center">
        <div className="card p-12 max-w-md mx-auto shadow-sm">
          <MessageSquareOff className="w-12 h-12 text-ink-tertiary mx-auto mb-4" />
          <h2 className="text-xl font-bold text-ink mb-2">Login Required</h2>
          <p className="text-ink-secondary text-sm mb-6">You need to be logged in to view your messages.</p>
          <button onClick={() => window.location.href = '/login'} className="btn-primary w-full py-3 h-12 text-base">Log In</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-app py-8">
      <h1 className="text-2xl font-bold text-ink mb-8">Inbox</h1>

      {threads.length === 0 ? (
        <div className="card p-20 text-center bg-white border-dashed border-2 border-surface-tertiary">
          <div className="w-16 h-16 bg-surface-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquareOff className="w-8 h-8 text-ink-tertiary" />
          </div>
          <p className="text-ink font-bold">Your inbox is empty</p>
          <p className="text-ink-secondary text-sm mt-1">When you message people, your chats will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[75vh] min-h-[600px]">
          {/* Sidebar */}
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
                  } ${thread.unreadCount > 0 ? 'bg-brand-50/50' : ''}`}
                  onClick={() => handleSelectThread(thread)}
                >
                  {thread.unreadCount > 0 && (
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full shadow-sm" />
                  )}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-sm font-bold flex-shrink-0 border-2 border-white shadow-sm">
                      {formatUsername(thread.otherName).charAt(0) || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <p className={`text-sm truncate ${thread.unreadCount > 0 ? "font-bold" : "font-semibold"} text-ink`}>{formatUsername(thread.otherName)}</p>
                        <span className="text-[10px] text-ink-tertiary whitespace-nowrap">{timeAgo(thread.lastTime)}</span>
                      </div>
                      <p className={`text-xs truncate ${thread.unreadCount > 0 ? "text-ink font-medium" : "text-ink-tertiary"}`}>{truncateText(thread.lastMessage || "", 40)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Main Thread */}
          <div className="md:col-span-2 card overflow-hidden flex flex-col bg-white">
            {activeThread ? (
              <MessageThread adId={activeThread.adId} adTitle={activeThread.adTitle} receiverId={activeThread.otherId} receiverName={activeThread.otherName} />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-ink-tertiary p-12 text-center">
                <div className="w-20 h-20 bg-surface-secondary rounded-full flex items-center justify-center mb-6 opacity-60">
                  <Loader2 className="w-8 h-8 opacity-20" />
                </div>
                <h3 className="text-lg font-bold text-ink mb-2">No conversation selected</h3>
                <p className="text-sm text-ink-secondary max-w-xs">Select one from the list to start chatting.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
