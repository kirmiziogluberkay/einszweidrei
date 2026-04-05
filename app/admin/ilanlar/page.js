/**
 * app/admin/ilanlar/page.js
 * ─────────────────────────────────────────────────────
 * Admin — tüm ilanları yönet (listele, sil, durum değiştir).
 * ─────────────────────────────────────────────────────
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Trash2, Eye, RefreshCw, Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatPrice, buildAdUrl, timeAgo } from '@/lib/helpers';
import { AD_STATUSES, ADMIN_ITEMS_PER_PAGE } from '@/constants/config';

export default function AdminIlanlarPage() {
  const supabase = createClient();

  const [ads,     setAds]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [page,    setPage]    = useState(1);
  const [total,   setTotal]   = useState(0);

  /**
   * Tüm ilanları (tüm durumlar dahil) çeker.
   */
  const fetchAds = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from('ads')
      .select(`
        id, serial_number, title, price, currency, status, created_at,
        owner:profiles!owner_id(id, username),
        category:categories(name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`title.ilike.%${search}%,serial_number.ilike.%${search}%`);
    }

    const from = (page - 1) * ADMIN_ITEMS_PER_PAGE;
    query = query.range(from, from + ADMIN_ITEMS_PER_PAGE - 1);

    const { data, count, error } = await query;
    if (!error) {
      setAds(data ?? []);
      setTotal(count ?? 0);
    }
    setLoading(false);
  }, [supabase, search, page]);

  useEffect(() => { fetchAds(); }, [fetchAds]);

  /**
   * İlanın durumunu değiştirir (active / passive / sold).
   * @param {string} adId
   * @param {string} newStatus
   */
  const handleStatusChange = async (adId, newStatus) => {
    await supabase.from('ads').update({ status: newStatus }).eq('id', adId);
    setAds((prev) => prev.map((a) => a.id === adId ? { ...a, status: newStatus } : a));
  };

  /**
   * İlanı kalıcı olarak siler.
   * @param {string} adId
   */
  const handleDelete = async (adId) => {
    if (!confirm('Bu ilanı silmek istediğinize emin misiniz?')) return;
    await supabase.from('ads').delete().eq('id', adId);
    setAds((prev) => prev.filter((a) => a.id !== adId));
    setTotal((prev) => prev - 1);
  };

  const totalPages = Math.ceil(total / ADMIN_ITEMS_PER_PAGE);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-ink">İlan Yönetimi <span className="text-ink-tertiary font-normal text-lg">({total})</span></h1>
        <button onClick={fetchAds} className="btn-secondary py-2">
          <RefreshCw className="w-4 h-4" /> Yenile
        </button>
      </div>

      {/* Arama */}
      <div className="relative mb-5 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-tertiary" />
        <input
          type="search"
          placeholder="Başlık veya seri no ara..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="input pl-9"
        />
      </div>

      {/* Tablo */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-secondary text-ink-secondary">
                <th className="text-left px-5 py-3 font-medium">İlan</th>
                <th className="text-left px-5 py-3 font-medium">Sahip</th>
                <th className="text-left px-5 py-3 font-medium">Fiyat</th>
                <th className="text-left px-5 py-3 font-medium">Durum</th>
                <th className="text-left px-5 py-3 font-medium">Tarih</th>
                <th className="text-right px-5 py-3 font-medium">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-tertiary">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="skeleton h-4 rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : ads.map((ad) => (
                <tr key={ad.id} className="hover:bg-surface-secondary transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-medium text-ink truncate max-w-[200px]">{ad.title}</p>
                    <p className="text-xs text-ink-tertiary font-mono">#{ad.serial_number}</p>
                  </td>
                  <td className="px-5 py-4 text-ink-secondary">{ad.owner?.username}</td>
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
                        aria-label="İlanı görüntüle"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(ad.id)}
                        className="p-2 rounded-lg hover:bg-red-50 text-ink-tertiary hover:text-red-500 transition-colors"
                        aria-label="İlanı sil"
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

        {/* Sayfalama */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-surface-tertiary">
            <p className="text-sm text-ink-secondary">{total} ilan</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40">← Önceki</button>
              <span className="text-sm text-ink-secondary px-3 py-1.5">{page}/{totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40">Sonraki →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
