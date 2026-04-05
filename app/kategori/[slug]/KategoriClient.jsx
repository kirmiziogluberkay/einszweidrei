/**
 * app/kategori/[slug]/KategoriClient.jsx
 * ─────────────────────────────────────────────────────
 * Kategori sayfasının istemci kısmı.
 * İlan listesi, sayfalama.
 * ─────────────────────────────────────────────────────
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAds } from '@/hooks/useAds';
import AdGrid from '@/components/ads/AdGrid';

/**
 * @param {{
 *   category: {id: string, name: string, slug: string, parent?: object}
 * }} props
 */
export default function KategoriClient({ category }) {
  const [page, setPage] = useState(1);

  const { ads, loading, error, total, totalPages } = useAds({
    categoryId: category.id,
    page,
  });

  return (
    <div className="container-app py-8">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-ink-tertiary mb-6">
        <Link href="/" className="hover:text-ink transition-colors">Anasayfa</Link>
        <span>/</span>
        {category.parent && (
          <>
            <Link href={`/kategori/${category.parent.slug}`} className="hover:text-ink transition-colors">
              {category.parent.name}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-ink font-medium">{category.name}</span>
      </nav>

      {/* Başlık */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-ink">{category.name}</h1>
        {!loading && (
          <p className="text-ink-secondary text-sm mt-1">{total} ilan bulundu</p>
        )}
      </div>

      <AdGrid
        ads={ads}
        loading={loading}
        error={error}
        emptyMessage={`${category.name} kategorisinde ilan bulunamadı.`}
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-10">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary px-4 py-2 disabled:opacity-40">← Önceki</button>
          <span className="text-sm text-ink-secondary px-4">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary px-4 py-2 disabled:opacity-40">Sonraki →</button>
        </div>
      )}
    </div>
  );
}
