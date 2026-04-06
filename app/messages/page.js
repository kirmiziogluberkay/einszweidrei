/**
 * app/messages/page.js
 * ─────────────────────────────────────────────────────
 * Mesaj kutusu — kullanıcının tüm konuşmaları.
 * Her konuşma bir ilan üzerinden başlar.
 * ─────────────────────────────────────────────────────
 */

'use client';

import { useState, useEffect } from 'react';
import { Loader2, Trash2, MessageSquareOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import MessageThread from '@/components/messages/MessageThread';
import { useNotifications } from '@/hooks/useNotifications';
import { timeAgo, truncateText } from '@/lib/helpers';


export default function MessagesPage() {
  const supabase = createClient();
  const { user, loading: authLoading } = useAuth();
  const { refetch: refetchNotifications } = useNotifications();

  /** Konuşma listesi — (ad_id, diğer kullanıcı) bazında gruplandırılmış */
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  /** Seçili konuşma */
  const [activeThread, setActiveThread] = useState(null);

  const handleSelectThread = (thread) => {
    setActiveThread(thread);
    // Badge'i hemen sildirmek için refetch tetikle
    if (refetchNotifications) {
      setTimeout(() => refetchNotifications(), 500);
    }
  };

  /**
   * Gelen/gönderilen mesajları çekip ad bazında gruplandırır.
   */
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

      // Her (ad_id, diğer_kullanıcı) çifti için en son mesajı tut
      const threadMap = {};
      messages.forEach((msg) => {
        // Eğer ad verisi silindiyse bu konuşmayı gösterme
        if (!msg.ad) return;

        const otherId     = msg.sender?.id === user.id ? msg.receiver?.id : msg.sender?.id;
        const otherName   = msg.sender?.id === user.id ? msg.receiver?.username : msg.sender?.username;
        
        if (!otherId) return;

        const key = `${msg.ad.id}_${otherId}`;

        if (!threadMap[key]) {
          threadMap[key] = {
            key,
            adId:        msg.ad.id,
            adTitle:     msg.ad.title,
            serialNumber:msg.ad.serial_number,
            otherId,
            otherName:   otherName || 'Unknown User',
            lastMessage: msg.content,
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

  /**
   * Bir konuşmayı ve tüm ilgili mesajları siler.
   * @param {string} adId
   * @param {string} otherId
   */
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
          <p className="text-xs text-ink-tertiary">Loading messages...</p>
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
          <button onClick={() => window.location.href = '/login'} className="btn-primary w-full py-3">Log In</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-app py-8">
      <h1 className="section-title mb-8">Messages</h1>

      {threads.length === 0 ? (
        <div className="card p-20 text-center bg-white border-dashed border-2 border-surface-tertiary">
          <div className="w-16 h-16 bg-surface-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquareOff className="w-8 h-8 text-ink-tertiary" />
          </div>
          <p className="text-ink font-semibold">No messages yet</p>
          <p className="text-ink-secondary text-sm mt-1">When you contact a seller, your conversations will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[650px]">

          {/* ── Sol: Konuşma listesi ── */}
          <div className="md:col-span-1 card overflow-hidden flex flex-col bg-white">
            <div className="p-4 border-b border-surface-tertiary bg-surface-secondary/30">
              <h2 className="font-bold text-ink text-sm">Conversations</h2>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-surface-tertiary">
              {threads.map((thread) => (
                <div
                  key={thread.key}
                  className={`relative group cursor-pointer p-4 hover:bg-surface-secondary transition-colors ${
                    activeThread?.key === thread.key ? 'bg-surface-secondary' : ''
                  } ${thread.unread ? 'bg-brand-50/50' : ''}`}
                  onClick={() => handleSelectThread(thread)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleSelectThread(thread)}
                >
                  {/* Okunmamış göstergesi */}
                  {thread.unread && (
                    <span className="absolute top-1/2 -translate-y-1/2 right-4 w-2.5 h-2.5 bg-brand-500 rounded-full shadow-[0_0_8px_rgba(14,165,233,0.4)]" />
                  )}

                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-brand-100 text-brand-600
                                    flex items-center justify-center text-sm font-bold flex-shrink-0 border-2 border-white shadow-sm">
                      {thread.otherName?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${thread.unread ? 'font-bold text-ink' : 'font-semibold text-ink'}`}>
                        {thread.otherName}
                      </p>
                      <p className={`text-xs truncate mt-0.5 ${thread.unread ? 'text-ink font-medium' : 'text-ink-tertiary'}`}>
                        {truncateText(thread.lastMessage, 45)}
                      </p>
                      <p className="text-[10px] text-ink-tertiary mt-1 flex items-center gap-1">
                        <span className="truncate max-w-[100px]">{thread.adTitle}</span>
                        <span>•</span>
                        <span>{timeAgo(thread.lastTime)}</span>
                      </p>
                    </div>
                  </div>

                  {/* Sil butonu */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteThread(thread.adId, thread.otherId);
                    }}
                    aria-label="Delete chat"
                    className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100
                               p-2 rounded-lg text-ink-tertiary hover:text-red-500 hover:bg-red-50 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ── Sağ: Aktif konuşma ── */}
          <div className="md:col-span-2 card overflow-hidden flex flex-col bg-white">
            {activeThread ? (
              <MessageThread
                adId={activeThread.adId}
                adTitle={activeThread.adTitle}
                receiverId={activeThread.otherId}
                receiverName={activeThread.otherName}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-ink-tertiary p-8 text-center">
                <div className="w-16 h-16 bg-surface-secondary rounded-full flex items-center justify-center mb-4">
                   <Loader2 className="w-8 h-8 opacity-20" />
                </div>
                <p className="text-sm font-medium">Select a conversation to start chatting</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
