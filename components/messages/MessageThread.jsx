/**
 * components/messages/MessageThread.jsx
 * ─────────────────────────────────────────────────────
 * İki kullanıcı arasındaki mesaj dizisini gösterir
 * ve yeni mesaj gönderme formunu içerir.
 * ─────────────────────────────────────────────────────
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Send, Loader2, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatMessageDate } from '@/lib/helpers';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/constants/config';

/**
 * @param {{
 *   adId: string,
 *   receiverId: string,    // Mesaj alacak kullanıcı
 *   receiverName: string,
 *   adTitle: string
 * }} props
 */
export default function MessageThread({ adId, receiverId, receiverName, adTitle }) {
  const supabase = createClient();
  const { user } = useAuth();
  const bottomRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [content, setContent]   = useState('');
  const [loading, setLoading]   = useState(true);
  const [adInfo, setAdInfo]     = useState(null);
  const [sending, setSending]   = useState(false);
  const [error, setError]       = useState(null);

  /**
   * Bu ilan için mesajları çeker.
   */
  const fetchMessages = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('messages')
      .select(`
        id, content, created_at, is_read,
        sender:profiles!sender_id(id, username),
        receiver:profiles!receiver_id(id, username)
      `)
      .eq('ad_id', adId)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: true });

    setMessages(data ?? []);
    setLoading(false);

    // Fetch ad info for preview
    const { data: adData } = await supabase
      .from('ads')
      .select('id, title, price, currency, images, serial_number')
      .eq('id', adId)
      .single();
    
    if (adData) setAdInfo(adData);

    // Okunmamış mesajları okundu olarak işaretle
    markAsRead();
  };

  /**
   * Kullanıcıya gelen okunmamış mesajları okundu olarak işaretler.
   */
  const markAsRead = async () => {
    if (!user) return;
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('ad_id', adId)
      .eq('receiver_id', user.id)
      .eq('is_read', false);
  };

  useEffect(() => {
    fetchMessages();

    // Realtime abonelik — yeni mesaj gelince listeyi güncelle
    const channel = supabase
      .channel(`messages:ad_id=eq.${adId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `ad_id=eq.${adId}`,
      }, () => fetchMessages())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adId, user]);

  // Yeni mesaj gelince en alta kaydır
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Yeni mesaj gönderir.
   * @param {React.FormEvent} e
   */
  const handleSend = async (e) => {
    e.preventDefault();
    if (!content.trim() || !user) return;

    setSending(true);
    setError(null);

    const { error: sendError } = await supabase.from('messages').insert({
      sender_id:   user.id,
      receiver_id: receiverId,
      content:     content.trim(),
      ad_id:       adId,
    });

    if (sendError) {
      setError(ERROR_MESSAGES.generic);
    } else {
      setContent('');
    }

    setSending(false);
  };

  /**
   * Belirtilen mesajı siler.
   * Kullanıcı sadece kendi gönderdiği mesajları silebilir.
   *
   * @param {string} messageId
   */
  const handleDeleteMessage = async (messageId) => {
    await supabase
      .from('messages')
      .delete()
      .eq('id', messageId)
      .eq('sender_id', user.id);

    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-ink-tertiary">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* ── İlan Önizlemesi ── */}
      {adInfo && (
        <Link 
          href={`/adv/${adInfo.serial_number}`}
          className="flex items-center gap-3 p-3 bg-surface-secondary border-b border-surface-tertiary hover:bg-surface-tertiary transition-colors"
        >
          <div className="w-12 h-12 rounded-lg bg-white overflow-hidden flex-shrink-0 border border-surface-tertiary/50">
            {adInfo.images?.[0] && (
              <img src={adInfo.images[0]} alt={adInfo.title} className="w-full h-full object-cover" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-ink truncate">{adInfo.title}</p>
            <p className="text-[10px] text-brand-600 font-semibold mt-0.5">
              {adInfo.price ? `${adInfo.price} ${adInfo.currency}` : 'Free'}
            </p>
          </div>
          <div className="text-[10px] text-ink-tertiary flex items-center gap-1">
            <span>View Ad</span>
            <span className="text-sm">›</span>
          </div>
        </Link>
      )}

      {/* ── Başlık ── */}
      <div className="px-4 py-3 border-b border-surface-tertiary flex items-center justify-between bg-white">
        <div>
          <p className="text-sm font-bold text-ink">{receiverName}</p>
          <p className="text-[10px] text-ink-tertiary">Chatting about this ad</p>
        </div>
      </div>

      {/* ── Mesaj listesi ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-ink-tertiary py-8">
            No messages yet. Be the first to send a message!
          </p>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender?.id === user?.id;

            return (
              <div
                key={msg.id}
                className={`flex gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`group relative max-w-[75%]`}>
                  {/* Mesaj balonu */}
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm ${
                      isMine
                        ? 'bg-brand-500 text-white rounded-br-md'
                        : 'bg-white text-ink border border-surface-tertiary rounded-bl-md'
                    }`}
                  >
                    {msg.content}
                  </div>

                  {/* Zaman ve sil butonu */}
                  <div className={`flex items-center gap-2 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-[10px] text-ink-tertiary">
                      {formatMessageDate(msg.created_at)}
                    </span>
                    {isMine && (
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        aria-label="Mesajı sil"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-ink-tertiary hover:text-red-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Mesaj gönderme formu ── */}
      {user && (
        <form onSubmit={handleSend} className="px-4 py-3 border-t border-surface-tertiary">
          {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
          <div className="flex gap-2">
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write a message..."
              maxLength={1000}
              className="input flex-1"
              id="message-input"
            />
            <button
              type="submit"
              disabled={sending || !content.trim()}
              aria-label="Mesaj gönder"
              className="btn-primary px-3 py-3"
            >
              {sending
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Send className="w-4 h-4" />
              }
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
