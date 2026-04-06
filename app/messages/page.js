/**
 * app/messages/page.js
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
import { timeAgo, truncateText } from '@/lib/helpers';


export default function MessagesPage() {
  const [initError, setInitError] = useState(null);

  try {
    const supabase = createClient();
    const { user, loading: authLoading } = useAuth();
    const notifications = useNotifications();
    const refetchNotifications = notifications?.refetch;

    const [threads, setThreads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeThread, setActiveThread] = useState(null);

    const handleSelectThread = (thread) => {
      setActiveThread(thread);
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
        if (!messages) { setLoading(false); return; }

        const threadMap = {};
        messages.forEach((msg) => {
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
              unread:      !msg.is_read && msg.receiver?.id === user.id,
            };
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
      if (!authLoading) {
        fetchThreads();
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
        <h1 className="text-2xl font-bold text-ink mb-8">Messages</h1>

        {threads.length === 0 ? (
          <div className="card p-20 text-center bg-white border-dashed border-2 border-surface-tertiary">
            <div className="w-16 h-16 bg-surface-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquareOff className="w-8 h-8 text-ink-tertiary" />
            </div>
            <p className="text-ink font-bold">Your inbox is empty</p>
            <p className="text-ink-secondary text-sm mt-1">When you message people, your chats will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-h-[600px] h-[75vh]">
            {/* Sidebar */}
            <div className="md:col-span-1 card overflow-hidden flex flex-col bg-white border-none shadow-sm">
              <div className="p-4 border-b border-surface-tertiary bg-surface-secondary/20">
                <h2 className="font-bold text-ink text-sm">Inbox</h2>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-surface-tertiary">
                {threads.map((thread) => (
                  <div
                    key={thread.key}
                    className={`relative group cursor-pointer p-4 hover:bg-surface-secondary transition-all ${
                      activeThread?.key === thread.key ? 'bg-surface-secondary' : ''
                    } ${thread.unread ? 'bg-brand-50/50' : ''}`}
                    onClick={() => handleSelectThread(thread)}
                  >
                    {thread.unread && (
                      <span className="absolute top-1/2 -translate-y-1/2 right-4 w-2.5 h-2.5 bg-brand-500 rounded-full shadow-[0_0_10px_rgba(14,165,233,0.5)]" />
                    )}
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-sm font-bold flex-shrink-0 border-2 border-white shadow-sm">
                        {String(thread.otherName || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <p className={`text-sm truncate ${thread.unread ? 'font-bold text-ink' : 'font-semibold text-ink'}`}>{thread.otherName}</p>
                          <span className="text-[10px] text-ink-tertiary whitespace-nowrap">{timeAgo(thread.lastTime)}</span>
                        </div>
                        <p className={`text-xs truncate ${thread.unread ? 'text-ink font-medium' : 'text-ink-tertiary'}`}>{truncateText(thread.lastMessage || '', 40)}</p>
                        <p className="text-[10px] text-brand-600 font-medium truncate mt-1">{thread.adTitle}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Thread */}
            <div className="md:col-span-2 card overflow-hidden flex flex-col bg-white border-none shadow-sm">
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
  } catch (err) {
    return (
      <div className="container-app py-16 text-center">
        <div className="card p-12 max-w-md mx-auto border-red-100 bg-red-50/30">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-ink mb-2">Something went wrong</h2>
          <p className="text-ink-secondary text-sm mb-6">Error: {err.message || 'Unknown initialization error'}</p>
          <button onClick={() => window.location.reload()} className="btn-secondary w-full py-3 h-12 text-base">Refresh Page</button>
        </div>
      </div>
    );
  }
}
