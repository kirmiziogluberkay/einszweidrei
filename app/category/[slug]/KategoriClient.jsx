/**
 * app/category/[slug]/KategoriClient.jsx
 * ─────────────────────────────────────────────────────
 * Category page client component.
 * Shows ads from current category AND all its subcategories.
 * Left sidebar shows hierarchical navigation tree.
 * ─────────────────────────────────────────────────────
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAds } from '@/hooks/useAds';
import AdGrid from '@/components/ads/AdGrid';

export default function KategoriClient({ category }) {
  const [page, setPage] = useState(1);

  // If parent category, include all children in query
  const childIds = category.children?.map(c => c.id) ?? [];
  const categoryIds = childIds.length > 0
    ? [category.id, ...childIds]
    : null;

  const { ads, loading, error, total, totalPages } = useAds({
    categoryId: categoryIds ? null : category.id,
    categoryIds: categoryIds ?? undefined,
    page,
  });

  return (
    <div className="container-app py-8">

      {/* Top breadcrumb (compact, for mobile) */}
      <nav className="flex md:hidden items-center gap-1.5 text-sm text-ink-tertiary mb-6">
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

      {/* Main layout: sidebar + content */}
      <div className="flex gap-8">

        {/* ── Left Sidebar: Tree Navigation ── */}
        <aside className="hidden md:block w-52 flex-shrink-0">
          <div className="sticky top-20 bg-white border border-surface-tertiary rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-ink-tertiary uppercase tracking-wider mb-3">Navigation</p>

            <ul className="space-y-0.5 text-sm">
              {/* Home */}
              <li>
                <Link href="/" className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-ink-secondary hover:text-ink hover:bg-surface-secondary transition-colors">
                  <span>🏠</span>
                  <span>Home</span>
                </Link>
              </li>

              {/* Parent category */}
              {category.parent?.name && (
                <li className="pl-4">
                  <Link
                    href={`/category/${category.parent.slug}`}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-ink-secondary hover:text-ink hover:bg-surface-secondary transition-colors"
                  >
                    <span className="opacity-40 text-xs">└</span>
                    <span>{category.parent.name}</span>
                  </Link>
                </li>
              )}

              {/* Current category (active) */}
              <li className={category.parent?.name ? 'pl-8' : 'pl-4'}>
                <span className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-brand-50 text-brand-600 font-medium">
                  <span className="opacity-40 text-xs">└</span>
                  <span>{category.name}</span>
                </span>
              </li>

              {/* Subcategories (if showing parent category) */}
              {category.children?.length > 0 && (
                <>
                  <li className="pl-8 pt-1">
                    <p className="text-[10px] font-semibold text-ink-tertiary uppercase tracking-wider px-2 mb-1">Subcategories</p>
                  </li>
                  {category.children.map(child => (
                    <li key={child.id} className="pl-10">
                      <Link
                        href={`/category/${child.slug}`}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-ink-secondary hover:text-ink hover:bg-surface-secondary transition-colors text-xs"
                      >
                        <span className="opacity-40">└</span>
                        <span>{child.name}</span>
                      </Link>
                    </li>
                  ))}
                </>
              )}
            </ul>
          </div>
        </aside>

        {/* ── Right: Ad Listing ── */}
        <div className="flex-1 min-w-0">
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
      </div>
    </div>
  );
}
