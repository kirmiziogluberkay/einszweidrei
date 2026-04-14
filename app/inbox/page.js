'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { timeAgo, truncateText, formatUsername } from '@/lib/helpers';
import MessageThread from '@/components/messages/MessageThread';
import { Trash2, MessageSquare, Mail, MailOpen } from 'lucide-react';

const POLL_INTERVAL = 30_000;

export default function InboxPage() {
  const { user, loading: authLoading } = useAuth();
  const [threads, setThreads]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeThread, setActiveThread] = useState(null);

  const fetchThreads = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/messages?inbox=1');
      if (!res.ok) throw new Error('Failed to fetch threads');
      const data = await res.json();
      setThreads(data.threads ?? []);
    } catch (err) {
      console.error('Fetch threads error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchThreads();
      const id = setInterval(fetchThreads, POLL_INTERVAL);
      return () => clearInterval(id);
    }
  }, [user, authLoading, fetchThreads]);

  const handleSelectThread = async (thread) => {
    setActiveThread(thread);
    setThreads(prev => prev.map(t => t.key === thread.key ? { ...t, unreadCount: 0 } : t));

    const realAdId = (thread.ad_id && thread.ad_id !== 'no-ad' && thread.ad_id !== 'null')
      ? thread.ad_id : null;

    await fetch('/api/messages', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ otherId: thread.otherId, adId: realAdId, is_read: true }),
    });
  };

  const handleMarkUnread = async (thread) => {
    const realAdId = (thread.ad_id && thread.ad_id !== 'no-ad' && thread.ad_id !== 'null')
      ? thread.ad_id : null;

    await fetch('/api/messages', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ otherId: thread.otherId, adId: realAdId, is_read: false }),
    });

    fetchThreads();
  };

  const handleDeleteThread = async (adId, otherId) => {
    if (!confirm('Are you sure you want to delete this conversation? This will clear all messages.')) return;

    const realAdId = (adId && adId !== 'no-ad' && adId !== 'null') ? adId : null;

    const res = await fetch(
      `/api/messages?adId=${realAdId ?? ''}&otherId=${otherId}`,
      { method: 'DELETE' }
    );

    if (!res.ok) {
      alert("Delete failed. It might be already deleted or you don't have permissions.");
      return;
    }

    setThreads(prev => prev.filter(t => !(t.otherId === otherId && t.ad_id === adId)));
    if (activeThread?.otherId === otherId) setActiveThread(null);
  };

  if (authLoading || loading)
    return <div className="container-app py-12 text-center text-ink-tertiary">Loading...</div>;

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
          {/* Sidebar */}
          <div className="md:col-span-1 card overflow-hidden flex flex-col bg-white">
            <div className="p-4 border-b border-surface-tertiary">
              <h2 className="font-bold text-ink text-sm">Conversations</h2>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-surface-tertiary">
              {threads.map((thread) => (
                <div
                  key={thread.key}
                  className={`relative group cursor-pointer p-4 transition-all border-l-4 ${
                    activeThread?.key === thread.key
                      ? 'bg-surface-secondary border-brand-500'
                      : 'bg-white border-transparent hover:bg-surface-secondary'
                  }`}
                  onClick={() => handleSelectThread(thread)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-12 h-12 rounded-full bg-surface-secondary text-ink flex items-center justify-center text-sm font-bold flex-shrink-0 border border-surface-tertiary">
                        {thread.otherName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm truncate ${thread.unreadCount > 0 ? 'font-bold text-ink' : 'font-normal text-ink-secondary'}`}>
                          {formatUsername(thread.otherName)}
                        </p>
                        <p className={`text-xs truncate ${thread.unreadCount > 0 ? 'text-brand-600 font-bold' : 'text-ink-secondary font-normal'}`}>
                          {truncateText(thread.lastMessage || '', 40)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="text-[10px] text-ink-tertiary">{timeAgo(thread.lastTime)}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (thread.unreadCount > 0) {
                              handleSelectThread(thread);
                            } else {
                              handleMarkUnread(thread);
                            }
                          }}
                          title={thread.unreadCount > 0 ? 'Mark as read' : 'Mark as unread'}
                          className={`p-1 transition-colors opacity-0 group-hover:opacity-100 ${thread.unreadCount > 0 ? 'text-green-600' : 'text-ink-tertiary hover:text-green-500'}`}
                        >
                          {thread.unreadCount > 0 ? <Mail className="w-3.5 h-3.5" /> : <MailOpen className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteThread(thread.ad_id, thread.otherId); }}
                          className="p-1 text-ink-tertiary hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="md:col-span-2 card overflow-hidden flex flex-col bg-white">
            {activeThread ? (
              <MessageThread
                adId={activeThread.ad_id}
                receiverId={activeThread.otherId}
                receiverName={activeThread.otherName}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-ink-tertiary gap-4 text-center">
                <MessageSquare className="w-12 h-12 opacity-10" />
                <p>Select a conversation to start messaging</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
