'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { timeAgo, truncateText, formatUsername } from '@/lib/helpers';
import MessageThread from '@/components/messages/MessageThread';
import { Trash2, MessageSquare } from 'lucide-react';

export default function InboxPage() {
  const supabase = createClient();
  const { user, authLoading } = useAuth();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeThread, setActiveThread] = useState(null);

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
        const adKey = msg.ad_id ? msg.ad_id : 'no-ad';
        const key = `${adKey}_${otherId}`;

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

  // Real-time sync
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`inbox-sync-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user.id}`
      }, () => {
        fetchThreads();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel).catch(() => { }); };
  }, [user?.id]);

  const handleSelectThread = async (thread) => {
    setActiveThread(thread);
    setThreads(prev => prev.map(t => t.key === thread.key ? { ...t, unreadCount: 0 } : t));

    try {
      let updateQuery = supabase
        .from('messages')
        .update({ is_read: true })
        .eq('receiver_id', user.id)
        .eq('sender_id', thread.otherId)
        .eq('is_read', false);

      // İlan ID kontrolünü daha sağlam yap
      const realAdId = (thread.ad_id && thread.ad_id !== 'no-ad' && thread.ad_id !== 'null') ? thread.ad_id : null;

      if (realAdId) {
        updateQuery = updateQuery.eq('ad_id', realAdId);
      } else {
        updateQuery = updateQuery.is('ad_id', null);
      }

      const { error } = await updateQuery;
      if (error) throw error;
    } catch (err) {
      console.error('Okundu işaretleme hatası:', err.message);
    }
  };

  const handleDeleteThread = async (adId, otherId) => {
    if (!confirm('Are you sure you want to delete this conversation? This will clear all messages.')) return;

    try {
      // 1. Önce bu konuşmadaki tüm mesajların ID'lerini bul (En güvenli yöntem)
      // RLS zaten kendi mesajlarımızı sınırladığı için sadece otherId'ye odaklanmak yeterli
      let fetchMsgQuery = supabase
        .from('messages')
        .select('id')
        .or(`sender_id.eq.${otherId},receiver_id.eq.${otherId}`);

      // İlan ID varsa ekle, yoksa (Admin mesajları gibi) null kontrolü yap
      if (adId && adId !== 'no-ad' && adId !== 'null') {
        fetchMsgQuery = fetchMsgQuery.eq('ad_id', adId);
      } else {
        fetchMsgQuery = fetchMsgQuery.is('ad_id', null);
      }

      const { data: messagesToDelete, error: fetchError } = await fetchMsgQuery;
      
      if (fetchError || !messagesToDelete || messagesToDelete.length === 0) {
        throw new Error('There is no chat history or already deleted.');
      }

      const msgIds = messagesToDelete.map(m => m.id);

      // 2. ID listesini kullanarak kalıcı olarak sil
      // Bu yöntem en keskin ve hatasız silme yöntemidir.
      const { error: deleteError } = await supabase
        .from('messages')
        .delete()
        .in('id', msgIds);

      if (deleteError) throw deleteError;
      
      // Update local state and UI
      setThreads(prev => prev.filter(t => t.otherId !== otherId || (adId && t.ad_id !== adId)));
      if (activeThread?.otherId === otherId) {
         setActiveThread(null);
      }
      
      fetchThreads(); // Listeyi son kez tazele
    } catch (err) {
      console.error('Delete failed:', err.message);
      alert('Delete failed. It might be already deleted or you don\'t have permissions.');
    }
  };

  if (authLoading || loading) return <div className="container-app py-12 text-center text-ink-tertiary">Loading...</div>;

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
                        <p className={`text-sm truncate ${thread.unreadCount > 0 ? "font-bold text-ink" : "font-normal text-ink-tertiary"}`}>
                          {formatUsername(thread.otherName)}
                        </p>
                        <p className={`text-xs truncate ${thread.unreadCount > 0 ? "text-brand-600 font-bold" : "text-ink-tertiary font-normal"}`}>
                          {truncateText(thread.lastMessage || "", 40)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="text-[10px] text-ink-tertiary">{timeAgo(thread.lastTime)}</span>
                      <button 
                         onClick={(e) => { e.stopPropagation(); handleDeleteThread(thread.ad_id, thread.otherId); }}
                         className="p-1 text-ink-tertiary hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                         <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Field */}
          <div className="md:col-span-2 card overflow-hidden flex flex-col bg-white">
            {activeThread ? (
              <MessageThread adId={activeThread.ad_id} receiverId={activeThread.otherId} />
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