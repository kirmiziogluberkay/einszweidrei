/**
 * app/mesajlar/page.js
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
import { timeAgo, truncateText } from '@/lib/helpers';


export default function MesajlarPage() {
  const supabase = createClient();
  const { user, loading: authLoading } = useAuth();

  /** Konuşma listesi — (ad_id, diğer kullanıcı) bazında gruplandırılmış */
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  /** Seçili konuşma */
  const [activeThread, setActiveThread] = useState(null);

  /**
   * Gelen/gönderilen mesajları çekip ad bazında gruplandırır.
   */
  const fetchThreads = async () => {
    if (!user) return;
    setLoading(true);

    const { data: messages } = await supabase
      .from('messages')
      .select(`
        id, content, created_at, is_read,
        sender:profiles!sender_id(id, username),
        receiver:profiles!receiver_id(id, username),
        ad:ads!ad_id(id, serial_number, title)
      `)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (!messages) { setLoading(false); return; }

    // Her (ad_id, diğer_kullanıcı) çifti için en son mesajı tut
    const threadMap = {};
    messages.forEach((msg) => {
      const otherId     = msg.sender.id === user.id ? msg.receiver.id : msg.sender.id;
      const otherName   = msg.sender.id === user.id ? msg.receiver.username : msg.sender.username;
      const key         = `${msg.ad.id}_${otherId}`;

      if (!threadMap[key]) {
        threadMap[key] = {
          key,
          adId:        msg.ad.id,
          adTitle:     msg.ad.title,
          serialNumber:msg.ad.serial_number,
          otherId,
          otherName,
          lastMessage: msg.content,
          lastTime:    msg.created_at,
          unread:      !msg.is_read && msg.receiver.id === user.id,
        };
      }
    });

    setThreads(Object.values(threadMap));
    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchThreads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  /**
   * Bir konuşmayı ve tüm ilgili mesajları siler.
   * @param {string} adId
   * @param {string} otherId
   */
  const handleDeleteThread = async (adId, otherId) => {
    if (!confirm('Bu konuşmayı silmek istediğinize emin misiniz?')) return;

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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="container-app py-8">
      <h1 className="section-title">Mesajlarım</h1>

      {threads.length === 0 ? (
        <div className="card p-16 text-center">
          <MessageSquareOff className="w-12 h-12 text-ink-tertiary mx-auto mb-4" />
          <p className="text-ink-secondary text-sm">Henüz mesajınız yok.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">

          {/* ── Sol: Konuşma listesi ── */}
          <div className="md:col-span-1 card overflow-hidden flex flex-col">
            <div className="p-4 border-b border-surface-tertiary">
              <h2 className="font-semibold text-ink text-sm">Konuşmalar</h2>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-surface-tertiary">
              {threads.map((thread) => (
                <div
                  key={thread.key}
                  className={`relative group cursor-pointer p-4 hover:bg-surface-secondary transition-colors ${
                    activeThread?.key === thread.key ? 'bg-surface-secondary' : ''
                  }`}
                  onClick={() => setActiveThread(thread)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setActiveThread(thread)}
                >
                  {/* Okunmamış göstergesi */}
                  {thread.unread && (
                    <span className="absolute top-4 right-4 w-2 h-2 bg-brand-500 rounded-full" />
                  )}

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600
                                    flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {thread.otherName?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${thread.unread ? 'font-semibold text-ink' : 'font-medium text-ink'}`}>
                        {thread.otherName}
                      </p>
                      <p className="text-xs text-ink-tertiary truncate mt-0.5">
                        {truncateText(thread.lastMessage, 50)}
                      </p>
                      <p className="text-[10px] text-ink-tertiary mt-0.5">
                        {thread.adTitle} · {timeAgo(thread.lastTime)}
                      </p>
                    </div>
                  </div>

                  {/* Sil butonu */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteThread(thread.adId, thread.otherId);
                    }}
                    aria-label="Konuşmayı sil"
                    className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100
                               p-1 rounded-lg text-ink-tertiary hover:text-red-400 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ── Sağ: Aktif konuşma ── */}
          <div className="md:col-span-2 card overflow-hidden flex flex-col">
            {activeThread ? (
              <MessageThread
                adId={activeThread.adId}
                adTitle={activeThread.adTitle}
                receiverId={activeThread.otherId}
                receiverName={activeThread.otherName}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-ink-tertiary text-sm">
                Bir konuşma seçin
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
