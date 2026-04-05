/**
 * components/ads/AdGrid.jsx
 * ─────────────────────────────────────────────────────
 * İlan kartlarını ızgara düzeninde gösteren bileşen.
 * Yükleme, boş durum ve hata halleri dahildir.
 * ─────────────────────────────────────────────────────
 */

'use client';

import AdCard from './AdCard';

/**
 * @param {{
 *   ads: Array,
 *   loading: boolean,
 *   error: string | null,
 *   emptyMessage?: string
 * }} props
 */
export default function AdGrid({
  ads = [],
  loading = false,
  error = null,
  emptyMessage = 'Henüz ilan bulunmuyor.',
  layout = 'grid',
}) {

  // ── Yükleme durumu ── skeleton kartlar
  if (loading) {
    return (
      <div className={layout === 'grid' 
        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
        : "flex flex-col gap-5"
      }>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={layout === 'grid' ? "card animate-pulse" : "card animate-pulse flex flex-col md:flex-row gap-6 p-4"}>
            <div className={layout === 'grid' ? "skeleton aspect-[4/3]" : "skeleton w-full md:w-64 h-48 md:h-40 rounded-xl"} />
            <div className="flex-1 p-4 space-y-3">
              <div className="skeleton h-4 w-1/3" />
              <div className="skeleton h-5 w-full" />
              <div className="skeleton h-4 w-4/5" />
              <div className="flex justify-between">
                <div className="skeleton h-6 w-1/3" />
                <div className="skeleton h-4 w-1/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── Hata durumu ──
  if (error) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-4">⚠️</div>
        <p className="text-ink-secondary text-sm">{error}</p>
      </div>
    );
  }

  // ── Boş liste durumu ──
  if (ads.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-3xl bg-surface-secondary flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-ink-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2
                 M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <p className="text-ink-secondary text-sm">{emptyMessage}</p>
      </div>
    );
  }

  // ── Normal durum ──
  return (
    <div className={layout === 'grid' 
      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
      : "flex flex-col gap-6"
    }>
      {ads.map((ad) => (
        <AdCard key={ad.id} ad={ad} layout={layout} />
      ))}
    </div>
  );
}
