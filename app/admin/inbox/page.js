/**
 * app/admin/inbox/page.js — Admin: monitor all message traffic
 */
'use client';

import { useState, useEffect } from 'react';
import { Trash2, RefreshCw } from 'lucide-react';
import { truncateText, timeAgo } from '@/lib/helpers';
import { ADMIN_ITEMS_PER_PAGE } from '@/constants/config';

export default function AdminInboxPage() {
  const [messages, setMessages] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(1);
  const [total,    setTotal]    = useState(0);

  const fetchMessages = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(ADMIN_ITEMS_PER_PAGE) });
    const res = await fetch(`/api/admin/messages?${params}`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages ?? []);
      setTotal(data.total ?? 0);
    }
    setLoading(false);
  };

  useEffect(() => { fetchMessages(); }, [page]);

  const handleDelete = async (messageId) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    await fetch(`/api/messages/${messageId}`, { method: 'DELETE' });
    setMessages(prev => prev.filter(m => m.id !== messageId));
    setTotal(t => (t > 0 ? t - 1 : 0));
  };

  const totalPages = Math.ceil(total / ADMIN_ITEMS_PER_PAGE);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-ink">Inboxes Monitoring</h1>
          <p className="text-sm text-ink-secondary mt-1">Manage and moderate all conversations across the platform.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white px-4 py-2 rounded-xl border border-surface-tertiary">
            <span className="text-xs text-ink-tertiary font-medium uppercase tracking-wider block">Total Messages</span>
            <span className="text-xl font-bold text-brand-600 leading-none">{total}</span>
          </div>
          <button onClick={fetchMessages} className="btn-secondary py-3 px-4 h-full">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="card overflow-hidden shadow-sm border-none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-secondary/50 text-ink-secondary">
                <th className="text-left px-6 py-4 font-bold uppercase tracking-tighter text-[11px]">Chat Participants</th>
                <th className="text-left px-6 py-4 font-bold uppercase tracking-tighter text-[11px]">Ad</th>
                <th className="text-left px-6 py-4 font-bold uppercase tracking-tighter text-[11px]">Content</th>
                <th className="text-left px-6 py-4 font-bold uppercase tracking-tighter text-[11px]">Date</th>
                <th className="text-right px-6 py-4 font-bold uppercase tracking-tighter text-[11px]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-tertiary">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-6 py-5"><div className="skeleton h-4 w-full rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : messages.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-ink-tertiary">No messages found.</td>
                </tr>
              ) : messages.map((msg) => (
                <tr key={msg.id} className="hover:bg-brand-50/20 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="font-bold text-ink text-sm">@{msg.senderUsername || 'Unknown'}</span>
                      <span className="text-[11px] text-ink-tertiary">to @{msg.receiverUsername || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <span className="bg-brand-50 text-brand-600 text-[10px] font-bold px-1.5 py-0.5 rounded">#{msg.adSerial || 'DEL'}</span>
                      <p className="text-xs text-ink-secondary font-medium truncate max-w-[120px]">{msg.adTitle || 'Deleted Ad'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-ink-secondary leading-relaxed line-clamp-1">{truncateText(msg.content, 80)}</span>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-xs text-ink-tertiary">{timeAgo(msg.created_at)}</td>
                  <td className="px-6 py-5 text-right">
                    <button
                      onClick={() => handleDelete(msg.id)}
                      className="p-2.5 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-red-50 text-ink-tertiary hover:text-red-500 transition-all shadow-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 bg-surface-secondary/20 flex items-center justify-between border-t border-surface-tertiary">
            <span className="text-xs text-ink-tertiary font-medium">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary py-2 px-4 shadow-sm disabled:opacity-40">Previous</button>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary py-2 px-4 shadow-sm disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
