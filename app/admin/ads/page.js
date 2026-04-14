/**
 * app/admin/ads/page.js — Admin: manage all ads
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Trash2, Eye, RefreshCw, Search } from 'lucide-react';
import { formatPrice, buildAdUrl, timeAgo } from '@/lib/helpers';
import { AD_STATUSES, ADMIN_ITEMS_PER_PAGE } from '@/constants/config';

export default function AdminAdsPage() {
  const [ads,     setAds]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [page,    setPage]    = useState(1);
  const [total,   setTotal]   = useState(0);

  const fetchAds = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      all:  '1',
      page: String(page),
      limit: String(ADMIN_ITEMS_PER_PAGE),
    });
    if (search) params.set('q', search);

    const res = await fetch(`/api/ads?${params}`);
    if (res.ok) {
      const data = await res.json();
      setAds(data.ads ?? []);
      setTotal(data.total ?? 0);
    }
    setLoading(false);
  }, [search, page]);

  useEffect(() => { fetchAds(); }, [fetchAds]);

  const handleStatusChange = async (adId, newStatus) => {
    await fetch(`/api/ads/${adId}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status: newStatus }),
    });
    setAds(prev => prev.map(a => a.id === adId ? { ...a, status: newStatus } : a));
  };

  const handleDelete = async (adId) => {
    if (!confirm('Are you sure you want to delete this ad?')) return;
    await fetch(`/api/ads/${adId}`, { method: 'DELETE' });
    setAds(prev => prev.filter(a => a.id !== adId));
    setTotal(prev => prev - 1);
  };

  const totalPages = Math.ceil(total / ADMIN_ITEMS_PER_PAGE);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-ink">
          Ads Management <span className="text-ink-tertiary font-normal text-lg">({total})</span>
        </h1>
        <button onClick={fetchAds} className="btn-secondary py-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="relative mb-5 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-tertiary" />
        <input
          type="search"
          placeholder="Search title or serial no..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="input pl-9"
        />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-secondary text-ink-secondary">
                <th className="text-left px-5 py-3 font-medium">Ad</th>
                <th className="text-left px-5 py-3 font-medium">Owner</th>
                <th className="text-left px-5 py-3 font-medium">Price</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-left px-5 py-3 font-medium">Date</th>
                <th className="text-right px-5 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-tertiary">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-5 py-4"><div className="skeleton h-4 rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : ads.map((ad) => (
                <tr key={ad.id} className="hover:bg-surface-secondary transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-medium text-ink truncate max-w-[200px]">{ad.title}</p>
                    <p className="text-xs text-ink-tertiary font-mono">#{ad.serial_number}</p>
                  </td>
                  <td className="px-5 py-4 text-ink-secondary">{ad.owner?.username ?? ad.ownerUsername}</td>
                  <td className="px-5 py-4 font-medium text-ink">{formatPrice(ad.price, ad.currency)}</td>
                  <td className="px-5 py-4">
                    <select
                      value={ad.status}
                      onChange={(e) => handleStatusChange(ad.id, e.target.value)}
                      className="text-xs border border-surface-tertiary rounded-lg px-2 py-1 bg-white"
                    >
                      {Object.entries(AD_STATUSES).map(([key, { label }]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-4 text-ink-secondary text-xs">{timeAgo(ad.created_at)}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1 justify-end">
                      <Link href={buildAdUrl(ad.serial_number)} target="_blank"
                        className="p-2 rounded-lg hover:bg-surface-secondary text-ink-tertiary hover:text-ink transition-colors"
                        aria-label="View ad"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(ad.id)}
                        className="p-2 rounded-lg hover:bg-red-50 text-ink-tertiary hover:text-red-500 transition-colors"
                        aria-label="Delete ad"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-surface-tertiary">
            <p className="text-sm text-ink-secondary">{total} ads</p>
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
