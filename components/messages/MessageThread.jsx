/**
 * components/messages/MessageThread.jsx
 * ─────────────────────────────────────────────────────
 * Displays the message thread between two users
 * and contains the new message send form.
 * ─────────────────────────────────────────────────────
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Send, Loader2, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatMessageDate, formatUsername } from '@/lib/helpers';
import { ERROR_MESSAGES } from '@/constants/config';

/**
 * @param {{
 *   adId: string,
 *   receiverId: string,
 *   receiverName: string
 * }} props
 */
export default function MessageThread({ adId, receiverId, receiverName }) {
  const supabase = createClient();
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState([]);
  const scrollRef = useRef(null);
  const bottomRef = useRef(null); 
  const [content, setContent]   = useState('');
  const [loading, setLoading]   = useState(true);
  const [adInfo, setAdInfo]     = useState(null);
  const [sending, setSending]   = useState(false);
  const [error, setError]       = useState(null);

  // Rate limiting: track timestamps of the last few sends
  const sendTimestampsRef = useRef([]); // rolling window of send times
  const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
  const RATE_LIMIT_MAX       = 10;     // max 10 messages per minute

  /**
   * Fetches messages for this ad thread.
   */
  const fetchMessages = async () => {
    if (!user) return;

    let query = supabase
      .from('messages')
      .select(`
        id, content, created_at, is_read,
        sender:profiles!sender_id(id, username),
        receiver:profiles!receiver_id(id, username)
      `)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: true });

    if (adId && adId !== 'null') {
      query = query.eq('ad_id', adId);
    } else {
      query = query.is('ad_id', null);
    }

    const { data } = await query;

    setMessages(data ?? []);
    setLoading(false);

    // Fetch ad info for preview
    const { data: adData } = await supabase
      .from('ads')
      .select('id, title, price, currency, images, serial_number')
      .eq('id', adId)
      .single();
    
    if (adData) setAdInfo(adData);

    // Mark unread messages as read
    markAsRead();
  };

  /**
   * Marks incoming unread messages in this thread as read.
   */
  const markAsRead = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('messages')
        .update({ is_read: true });
        
      if (adId && adId !== 'null') {
        query = query.eq('ad_id', adId);
      } else {
        query = query.is('ad_id', null);
      }

      const { error } = await query
        .eq('receiver_id', user.id) 
        .eq('sender_id', receiverId)
        .eq('is_read', false);
      
      if (error) throw error;
    } catch (err) {
      console.warn('Mark as read error:', err.message);
    }
  };

  useEffect(() => {
    if (!user) return;
    
    fetchMessages();

    // Realtime subscription — refresh list when a new message arrives
    const channel = supabase
      .channel(`thread-${user.id}-${receiverId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, (payload) => {
        // Only refresh if the message belongs to this conversation
        const newM = payload.new;
        const isRelevant = 
          (newM.sender_id === user.id && newM.receiver_id === receiverId) ||
          (newM.receiver_id === user.id && newM.sender_id === receiverId);
        
        const adCheck = (adId && adId !== 'null') ? String(newM.ad_id) === String(adId) : !newM.ad_id;

        if (isRelevant && adCheck) {
          fetchMessages();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adId, user, receiverId]);

  // Also mark as read when the message list changes (e.g. new message arrives)
  useEffect(() => {
    if (!user?.id || loading || messages.length === 0) return;

    const hasUnreadForMe = messages.some(m => !m.is_read && m.receiver_id === user.id);
    
    if (hasUnreadForMe) {
      markAsRead();
    }
  }, [messages, user?.id, loading]);

  // Scroll to bottom when messages change (new message arrives or conversation opens)
  useEffect(() => {
    const scrollToBottom = () => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
      // Fallback via scrollIntoView (instant transition with behavior: auto)
      bottomRef.current?.scrollIntoView({ behavior: 'auto' });
    };

    scrollToBottom();
    // Delayed confirmation in case DOM changes after images or ad info load
    const timeout = setTimeout(scrollToBottom, 300);
    return () => clearTimeout(timeout);
  }, [messages, adInfo, user?.id]); // adInfo included because ad image load changes height

  /**
   * Sends a new message.
   * @param {React.FormEvent} e
   */
  const handleSend = async (e) => {
    e.preventDefault();
    if (!content.trim() || !user) return;

    // Rate limiting: drop timestamps older than the window, then check count
    const now = Date.now();
    sendTimestampsRef.current = sendTimestampsRef.current.filter(
      (t) => now - t < RATE_LIMIT_WINDOW_MS
    );
    if (sendTimestampsRef.current.length >= RATE_LIMIT_MAX) {
      setError('You are sending messages too fast. Please wait a moment.');
      return;
    }
    sendTimestampsRef.current.push(now);

    // Mark existing messages as read when composing a reply
    markAsRead();

    setSending(true);
    setError(null);

    // Optimistic update — render the message immediately
    const optimisticMsg = {
      id:          'temp-' + Date.now(),
      content:     content.trim(),
      created_at:  new Date().toISOString(),
      is_read:     false,
      sender:      { id: user.id, username: profile?.username || 'Me' },
      receiver:    { id: receiverId, username: receiverName }
    };

    setMessages(prev => [...prev, optimisticMsg]);
    setContent('');

    const { error: sendError } = await supabase.from('messages').insert({
      sender_id:   user.id,
      receiver_id: receiverId,
      content:     content.trim(),
      ad_id:       adId,
    });

    if (sendError) {
      setError(ERROR_MESSAGES.generic);
      // Roll back the optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
    } else {
      // Fetch real data on success (for accurate ID and timestamp)
      fetchMessages();
    }

    setSending(false);
  };

  /**
   * Deletes the specified message.
   * Users can only delete messages they sent themselves.
   *
   * @param {string} messageId
   */
  const handleDeleteMessage = async (messageId) => {
    const { error: deleteError } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId)
      .eq('sender_id', user.id);

    if (deleteError) {
      setError('Could not delete the message. Please try again.');
      return;
    }
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
      {/* ── Ad Preview ── */}
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
          <p className="text-sm font-bold text-ink">{formatUsername(receiverName)}</p>
          <p className="text-[10px] text-ink-tertiary">Chatting about this ad</p>
        </div>
      </div>

      {/* ── Message list ── */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3"
      >
        {messages.length === 0 ? (
          <p className="text-center text-sm text-ink-tertiary py-8">
            No messages yet. Be the first to send a message!
          </p>
        ) : (
          messages.filter(m => m && m.id).map((msg) => {
            const isMine = msg.sender?.id === user?.id;

            return (
              <div
                key={msg.id}
                id={`msg-${msg.id}`}
                className={`flex gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`group relative max-w-[75%]`}>
                  {/* Message bubble */}
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm ${
                      isMine
                        ? 'bg-brand-500 text-white rounded-br-md shadow-[0_2px_4px_rgba(14,165,233,0.2)]'
                        : 'bg-white text-ink border border-surface-tertiary rounded-bl-md shadow-sm'
                    }`}
                  >
                    {msg.content || ''}
                  </div>

                  {/* Timestamp and delete button */}
                  <div className={`flex items-center gap-2 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-[10px] text-ink-tertiary">
                      {formatMessageDate(msg.created_at)}
                    </span>
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
        <div ref={bottomRef} />
      </div>

      {/* ── Send message form ── */}
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
