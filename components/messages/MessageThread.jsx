/**
 * components/messages/MessageThread.jsx
 * Displays the message thread between two users and contains the send form.
 */
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Send, Loader2, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatMessageDate, formatUsername } from '@/lib/helpers';
import { ERROR_MESSAGES } from '@/constants/config';

const POLL_INTERVAL = 15_000;

export default function MessageThread({ adId, receiverId, receiverName }) {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState([]);
  const scrollRef = useRef(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [adInfo, setAdInfo]   = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError]     = useState(null);

  // Rate limiting
  const sendTimestampsRef    = useRef([]);
  const RATE_LIMIT_WINDOW_MS = 60_000;
  const RATE_LIMIT_MAX       = 10;

  const realAdId = (adId && adId !== 'null' && adId !== 'no-ad') ? adId : null;

  const fetchMessages = useCallback(async (isMounted) => {
    if (!user) return;
    try {
      const params = new URLSearchParams({ receiverId });
      if (realAdId) params.set('adId', realAdId);

      const res = await fetch(`/api/messages?${params}`);
      if (!res.ok) return;
      const data = await res.json();

      if (isMounted?.current === false) return;
      setMessages(data.messages ?? []);
      if (data.adInfo) setAdInfo(data.adInfo);
    } finally {
      setLoading(false);
    }
  }, [user, receiverId, realAdId]);

  const markAsRead = useCallback(async () => {
    if (!user) return;
    await fetch('/api/messages', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ otherId: receiverId, adId: realAdId, is_read: true }),
    });
  }, [user, receiverId, realAdId]);

  useEffect(() => {
    if (!user) return;
    const isMounted = { current: true };
    fetchMessages(isMounted);
    markAsRead();

    const id = setInterval(() => fetchMessages(isMounted), POLL_INTERVAL);
    return () => {
      isMounted.current = false;
      clearInterval(id);
    };
  }, [adId, user, receiverId, fetchMessages, markAsRead]);

  // Mark as read when new messages arrive
  useEffect(() => {
    if (!user?.id || loading || messages.length === 0) return;
    const hasUnreadForMe = messages.some(m => !m.is_read && m.receiver?.id === user.id);
    if (hasUnreadForMe) markAsRead();
  }, [messages, user?.id, loading, markAsRead]);

  // Scroll to bottom
  useEffect(() => {
    const scrollToBottom = () => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    };
    scrollToBottom();
    const t = setTimeout(scrollToBottom, 150);
    return () => clearTimeout(t);
  }, [messages, adInfo, user?.id]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!content.trim() || !user) return;

    const now = Date.now();
    sendTimestampsRef.current = sendTimestampsRef.current.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
    if (sendTimestampsRef.current.length >= RATE_LIMIT_MAX) {
      setError('You are sending messages too fast. Please wait a moment.');
      return;
    }
    sendTimestampsRef.current.push(now);

    markAsRead();
    setSending(true);
    setError(null);

    const optimisticMsg = {
      id:         'temp-' + Date.now(),
      content:    content.trim(),
      created_at: new Date().toISOString(),
      is_read:    false,
      sender:     { id: user.id, username: profile?.username || 'Me' },
      receiver:   { id: receiverId, username: receiverName },
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setContent('');

    const res = await fetch('/api/messages', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ receiver_id: receiverId, ad_id: realAdId, content: content.trim() }),
    });

    if (!res.ok) {
      setError(ERROR_MESSAGES.generic);
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
    } else {
      fetchMessages({ current: true });
    }

    setSending(false);
  };

  const handleDeleteMessage = async (messageId) => {
    const res = await fetch(`/api/messages/${messageId}`, { method: 'DELETE' });
    if (!res.ok) {
      setError('Could not delete the message. Please try again.');
      return;
    }
    setMessages(prev => prev.filter(m => m.id !== messageId));
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
      {/* Ad Preview */}
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

      <div className="px-4 py-3 border-b border-surface-tertiary flex items-center justify-between bg-white">
        <div>
          <p className="text-sm font-bold text-ink">{formatUsername(receiverName ?? '')}</p>
          <p className="text-[10px] text-ink-tertiary">Chatting about this ad</p>
        </div>
      </div>

      {/* Message list */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-ink-tertiary py-8">
            No messages yet. Be the first to send a message!
          </p>
        ) : (
          messages.filter(m => m && m.id).map((msg) => {
            const isMine = msg.sender?.id === user?.id;
            return (
              <div key={msg.id} id={`msg-${msg.id}`} className={`flex gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className="group relative max-w-[75%]">
                  <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                    isMine
                      ? 'bg-brand-500 text-white rounded-br-md shadow-[0_2px_4px_rgba(14,165,233,0.2)]'
                      : 'bg-white text-ink border border-surface-tertiary rounded-bl-md shadow-sm'
                  }`}>
                    {msg.content || ''}
                  </div>
                  <div className={`flex items-center gap-2 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-[10px] text-ink-tertiary">{formatMessageDate(msg.created_at)}</span>
                    {isMine && msg.id && !String(msg.id).startsWith('temp-') && (
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        aria-label="Delete message"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-ink-tertiary hover:text-red-500"
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
      </div>

      {/* Send form */}
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
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={sending || !content.trim()}
              aria-label="Send message"
              className="btn-primary px-3 py-3"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
