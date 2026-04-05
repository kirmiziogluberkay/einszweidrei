/**
 * app/category/[slug]/KategoriClient.jsx
 * ─────────────────────────────────────────────────────
 * Category page client component.
 * Ad listing, pagination.
 * ─────────────────────────────────────────────────────
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAds } from '@/hooks/useAds';
import AdGrid from '@/components/ads/AdGrid';

export default function KategoriClient({ category }) {
  const [page, setPage] = useState(1);

  const { ads, loading, error, total, totalPages } = useAds({
    categoryId: category.id,
    page,
  });

  return (
    <div className="container-app py-8">

      {/* Breadcrumb - shows full path: Home / Parent / Category */}
      <nav className="flex items-center gap-1.5 text-sm text-ink-tertiary mb-6">
        <Link href="/" className="hover:text-ink transition-colors">Home</Link>
        <span className="opacity-40">/</span>
        {category.parent?.name && (
          <>
            <Link href={`/category/${category.parent.slug}`} className="hover:text-ink transition-colors">
              {category.parent.name}
            </Link>
            <span className="opacity-40">/</span>
          </>
        )}
        <span className="text-ink font-medium">{category.name}</span>
      </nav>

      {/* Title */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-ink">{category.name}</h1>
        {!loading && (
          <p className="text-ink-secondary text-sm mt-1">{total} ads found</p>
        )}
      </div>

      <AdGrid
        ads={ads}
        loading={loading}
        error={error}
        emptyMessage={`No ads found in ${category.name} category.`}
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-10">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary px-4 py-2 disabled:opacity-40">← Previous</button>
          <span className="text-sm text-ink-secondary px-4">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary px-4 py-2 disabled:opacity-40">Next →</button>
        </div>
      )}
    </div>
  );
}
