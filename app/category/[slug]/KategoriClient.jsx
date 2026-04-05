/**
 * app/category/[slug]/KategoriClient.jsx
 * ─────────────────────────────────────────────────────
 * Category page with full sidebar category tree navigation.
 * Active category and its breadcrumb are highlighted.
 * ─────────────────────────────────────────────────────
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useAds } from '@/hooks/useAds';
import AdGrid from '@/components/ads/AdGrid';
import { cn } from '@/lib/helpers';

export default function KategoriClient({ category, categoryTree = [] }) {
  const [page, setPage] = useState(1);

  // Expanded state for each root category in the sidebar
  const [expandedRoots, setExpandedRoots] = useState(() => {
    // Auto-expand the root that contains the active category
    const initial = {};
    categoryTree.forEach(root => {
      const isActive = root.id === category.id ||
        root.id === category.parent?.id ||
        root.children?.some(c => c.id === category.id);
      if (isActive) initial[root.id] = true;
    });
    return initial;
  });

  const toggleRoot = (id) =>
    setExpandedRoots(prev => ({ ...prev, [id]: !prev[id] }));

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

      {/* Mobile breadcrumb */}
      <nav className="flex md:hidden items-center gap-1.5 text-sm text-ink-tertiary mb-6 flex-wrap">
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

        {/* ── Left Sidebar: Full Category Tree ── */}
        <aside className="hidden md:block w-56 flex-shrink-0">
          <div className="sticky top-20 bg-white border border-surface-tertiary rounded-2xl p-4 shadow-sm">
            <ul className="space-y-0.5 text-sm">

              {/* Home link */}
              <li>
                <Link
                  href="/"
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-ink-secondary hover:text-ink hover:bg-surface-secondary transition-colors"
                >
                  <span>🏠</span>
                  <span className="font-medium">Home</span>
                </Link>
              </li>

              {/* Full category tree */}
              {categoryTree.map(root => {
                const isRootActive = root.id === category.id;
                const isExpanded = expandedRoots[root.id];

                return (
                  <li key={root.id}>
                    {/* Root category row */}
                    <div className="flex items-center gap-1">
                      {/* Expand/collapse toggle */}
                      {root.children?.length > 0 && (
                        <button
                          onClick={() => toggleRoot(root.id)}
                          className="p-0.5 rounded text-ink-tertiary hover:text-ink transition-colors"
                        >
                          {isExpanded
                            ? <ChevronDown className="w-3.5 h-3.5" />
                            : <ChevronRight className="w-3.5 h-3.5" />
                          }
                        </button>
                      )}

                      {/* Root category link */}
                      <Link
                        href={`/category/${root.slug}`}
                        className={cn(
                          'flex-1 flex items-center px-2 py-1.5 rounded-lg transition-colors text-sm font-medium',
                          isRootActive
                            ? 'bg-brand-50 text-brand-600'
                            : 'text-ink-secondary hover:text-ink hover:bg-surface-secondary'
                        )}
                      >
                        {root.name}
                      </Link>
                    </div>

                    {/* Children (subcategories) */}
                    {isExpanded && root.children?.length > 0 && (
                      <ul className="mt-0.5 space-y-0.5">
                        {root.children.map(child => {
                          const isChildActive = child.id === category.id;
                          return (
                            <li key={child.id} className="pl-5">
                              <Link
                                href={`/category/${child.slug}`}
                                className={cn(
                                  'flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-colors text-xs',
                                  isChildActive
                                    ? 'bg-brand-50 text-brand-600 font-medium'
                                    : 'text-ink-secondary hover:text-ink hover:bg-surface-secondary'
                                )}
                              >
                                <span className="opacity-30">└</span>
                                {child.name}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
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
