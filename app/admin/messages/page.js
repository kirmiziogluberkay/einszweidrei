/**
 * app/admin/messages/page.js — Admin: monitor all messages
 */
'use client';

import { useState, useEffect } from 'react';
import { Trash2, RefreshCw } from 'lucide-react';
import { truncateText, timeAgo } from '@/lib/helpers';
import { ADMIN_ITEMS_PER_PAGE } from '@/constants/config';

export default function AdminMessagesPage() {
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
    setTotal(t => t - 1);
  };

  const totalPages = Math.ceil(total / ADMIN_ITEMS_PER_PAGE);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-ink">
          Message Monitoring <span className="text-ink-tertiary font-normal text-lg">({total})</span>
        </h1>
        <button onClick={fetchMessages} className="btn-secondary py-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-secondary text-ink-secondary">
                <th className="text-left px-5 py-3 font-medium">Sender</th>
                <th className="text-left px-5 py-3 font-medium">Receiver</th>
                <th className="text-left px-5 py-3 font-medium">Ad</th>
                <th className="text-left px-5 py-3 font-medium">Message</th>
                <th className="text-left px-5 py-3 font-medium">Date</th>
                <th className="text-right px-5 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-tertiary">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-5 py-4"><div className="skeleton h-4 rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : messages.map((msg) => (
                <tr key={msg.id} className="hover:bg-surface-secondary transition-colors">
                  <td className="px-5 py-4 font-medium text-ink">{msg.senderUsername}</td>
                  <td className="px-5 py-4 text-ink-secondary">{msg.receiverUsername}</td>
                  <td className="px-5 py-4">
                    <span className="text-xs font-mono text-ink-tertiary">#{msg.adSerial}</span>
                    <p className="text-xs text-ink-secondary truncate max-w-[120px]">{msg.adTitle}</p>
                  </td>
                  <td className="px-5 py-4 text-ink-secondary max-w-[200px]">
                    <span className="block truncate">{truncateText(msg.content, 60)}</span>
                  </td>
                  <td className="px-5 py-4 text-xs text-ink-tertiary">{timeAgo(msg.created_at)}</td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => handleDelete(msg.id)}
                      aria-label="Delete message"
                      className="p-2 rounded-lg hover:bg-red-50 text-ink-tertiary hover:text-red-500 transition-colors"
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
          <div className="flex items-center justify-between px-5 py-4 border-t border-surface-tertiary">
            <p className="text-sm text-ink-secondary">{total} messages</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40">← Previous</button>
              <span className="text-sm text-ink-secondary px-3 py-1.5">{page}/{totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
