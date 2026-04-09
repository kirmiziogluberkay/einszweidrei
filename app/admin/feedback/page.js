'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Lightbulb, Trash2, User, Clock, RefreshCw } from 'lucide-react';
import { timeAgo } from '@/lib/helpers';

export default function AdminFeedbackPage() {
  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState([]);
  const supabase = createClient();

  const fetchFeedbacks = async () => {
    setLoading(true);
    // Messages starting with [FEEDBACK]
    const { data, error } = await supabase
      .from('messages')
      .select(`
        id, content, created_at,
        sender:profiles!sender_id(username)
      `)
      .like('content', '[FEEDBACK]%')
      .order('created_at', { ascending: false });

    if (!error) {
      setFeedbacks(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const deleteFeedback = async (id) => {
    if (!confirm('Are you sure you want to delete this suggestion?')) return;
    const { error } = await supabase.from('messages').delete().eq('id', id);
    if (!error) {
      setFeedbacks(prev => prev.filter(f => f.id !== id));
    }
  };

  return (
    <div className="animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-ink flex items-center gap-3">
            <Lightbulb className="w-7 h-7 text-brand-500 fill-brand-50" />
            User Feedbacks
          </h1>
          <p className="text-sm text-ink-secondary mt-1">Review suggestions and ideas from your users</p>
        </div>
        <button onClick={fetchFeedbacks} className="btn-secondary py-2 px-4 flex items-center gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading && feedbacks.length === 0 ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-32 rounded-2xl" />
          ))
        ) : feedbacks.length === 0 ? (
          <div className="md:col-span-2 py-20 text-center card bg-surface-secondary/50 border-dashed">
            <Lightbulb className="w-12 h-12 text-ink-tertiary mx-auto mb-4 opacity-20" />
            <p className="text-ink-secondary font-medium">No feedback received yet.</p>
          </div>
        ) : feedbacks.map((f) => (
          <div key={f.id} className="card p-6 flex flex-col justify-between hover:shadow-md transition-shadow group relative">
            <button 
              onClick={() => deleteFeedback(f.id)}
              className="absolute top-4 right-4 p-2 text-ink-tertiary hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <div>
              <div className="flex items-center gap-2 mb-4 text-xs font-bold text-brand-600 uppercase tracking-widest">
                <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse" />
                Suggestion
              </div>
              <p className="text-ink text-sm leading-relaxed italic border-l-4 border-brand-100 pl-4 py-1 bg-brand-50/20 rounded-r-lg">
                {f.content.replace('[FEEDBACK]: ', '')}
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-surface-tertiary/50 pt-4">
              <div className="flex items-center gap-2 text-xs text-ink-secondary font-medium">
                <User className="w-3.5 h-3.5 text-ink-tertiary" />
                {f.sender?.username || 'Anonymous'}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-ink-tertiary font-bold uppercase">
                <Clock className="w-3 h-3" />
                {timeAgo(f.created_at)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
