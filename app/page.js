/**
 * app/page.js
 * ─────────────────────────────────────────────────────
 * Home page — ad listing with sidebar category tree,
 * search bar, and category filter.
 * ─────────────────────────────────────────────────────
 */

'use client';

import { useState } from 'react';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';
import { useAds } from '@/hooks/useAds';
import { useCategories } from '@/hooks/useCategories';
import AdGrid from '@/components/ads/AdGrid';
import { SITE_TAGLINE } from '@/constants/config';
import { cn } from '@/lib/helpers';

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [expandedRoots, setExpandedRoots] = useState({});

  const { categoryTree } = useCategories();

  const { ads, loading, error, total, totalPages } = useAds({
    categoryId: selectedCategoryIds ? null : selectedCategory,
    categoryIds: selectedCategoryIds ?? undefined,
    searchQuery,
    page,
  });

  const toggleRoot = (id) =>
    setExpandedRoots(prev => ({ ...prev, [id]: !prev[id] }));

  const handleCategorySelect = (categoryId, parentCat = null) => {
    setSelectedCategory(categoryId);
    setPage(1);
    if (parentCat && parentCat.children?.length > 0) {
      const ids = [parentCat.id, ...parentCat.children.map(c => c.id)];
      setSelectedCategoryIds(ids);
    } else {
      setSelectedCategoryIds(null);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setPage(1);
  };

  return (
    <div className="container-app py-8">

      {/* ── Hero ── */}
      <section className="text-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-bold gradient-text mb-3">
          {SITE_TAGLINE}
        </h1>
        <p className="text-ink-secondary text-lg max-w-xl mx-auto">
          You are at the right place for a safe, fast, and easy shopping experience.
        </p>
      </section>

      {/* ── Search bar ── */}
      <section className="mb-8">
        <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl mx-auto">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-tertiary" />
            <input
              id="home-search"
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search ads..."
              className="input pl-11 py-3.5 text-base"
            />
          </div>
          <button type="submit" className="btn-primary px-6 py-3.5">Search</button>
        </form>

        {searchQuery && (
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="text-sm text-ink-secondary">
              Results for "<span className="font-medium text-ink">{searchQuery}</span>" ({total} ads)
            </span>
            <button
              onClick={() => { setSearchQuery(''); setSearchInput(''); setPage(1); }}
              className="text-xs text-brand-500 hover:underline"
            >
              Clear
            </button>
          </div>
        )}
      </section>

      {/* ── Main layout: sidebar + content ── */}
      <div className="flex gap-8">

        {/* ── LEFT SIDEBAR: Category Tree ── */}
        <aside className="hidden md:block w-56 flex-shrink-0">
          <div className="sticky top-20 bg-white border border-surface-tertiary rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-ink-tertiary uppercase tracking-wider mb-3">Categories</p>

            <ul className="space-y-0.5 text-sm">

              {/* All ads */}
              <li>
                <button
                  onClick={() => handleCategorySelect(null)}
                  className={cn(
                    'w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors font-medium text-left',
                    selectedCategory === null && !searchQuery
                      ? 'bg-brand-50 text-brand-600'
                      : 'text-ink-secondary hover:text-ink hover:bg-surface-secondary'
                  )}
                >
                  🏠 All Ads
                </button>
              </li>

              {/* Category tree */}
              {categoryTree.map(root => {
                const isRootActive = selectedCategory === root.id ||
                  selectedCategoryIds?.includes(root.id);
                const isExpanded = expandedRoots[root.id];

                return (
                  <li key={root.id}>
                    <div className="flex items-center gap-1">
                      {root.children?.length > 0 && (
                        <button
                          onClick={() => toggleRoot(root.id)}
                          className="p-0.5 rounded text-ink-tertiary hover:text-ink transition-colors flex-shrink-0"
                        >
                          {isExpanded
                            ? <ChevronDown className="w-3.5 h-3.5" />
                            : <ChevronRight className="w-3.5 h-3.5" />
                          }
                        </button>
                      )}
                      <button
                        onClick={() => handleCategorySelect(root.id, root)}
                        className={cn(
                          'flex-1 text-left px-2 py-1.5 rounded-lg transition-colors text-sm font-medium',
                          isRootActive
                            ? 'bg-brand-50 text-brand-600'
                            : 'text-ink-secondary hover:text-ink hover:bg-surface-secondary'
                        )}
                      >
                        {root.name}
                      </button>
                    </div>

                    {/* Children */}
                    {isExpanded && root.children?.length > 0 && (
                      <ul className="mt-0.5 space-y-0.5">
                        {root.children.map(child => {
                          const isChildActive = selectedCategory === child.id;
                          return (
                            <li key={child.id} className="pl-5">
                              <button
                                onClick={() => handleCategorySelect(child.id, null)}
                                className={cn(
                                  'w-full text-left flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-colors text-xs',
                                  isChildActive
                                    ? 'bg-brand-50 text-brand-600 font-medium'
                                    : 'text-ink-secondary hover:text-ink hover:bg-surface-secondary'
                                )}
                              >
                                <span className="opacity-30">└</span>
                                {child.name}
                              </button>
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

        {/* ── RIGHT: Ads ── */}
        <div className="flex-1 min-w-0">

          {/* Mobile category pills */}
          <div className="flex md:hidden gap-2 overflow-x-auto pb-2 mb-6 -mx-4 px-4 scrollbar-none">
            <button
              onClick={() => handleCategorySelect(null)}
              className={cn(
                'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all',
                selectedCategory === null
                  ? 'bg-ink text-white'
                  : 'bg-white text-ink-secondary border border-surface-tertiary'
              )}
            >
              All
            </button>
            {categoryTree.map(parent => (
              <div key={parent.id} className="flex items-center gap-1">
                <button
                  onClick={() => handleCategorySelect(parent.id, parent)}
                  className={cn(
                    'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all',
                    selectedCategory === parent.id
                      ? 'bg-ink text-white'
                      : 'bg-white text-ink-secondary border border-surface-tertiary'
                  )}
                >
                  {parent.name}
                </button>
                {parent.children?.map(child => (
                  <button
                    key={child.id}
                    onClick={() => handleCategorySelect(child.id, null)}
                    className={cn(
                      'flex-shrink-0 px-4 py-2 rounded-full text-sm transition-all',
                      selectedCategory === child.id
                        ? 'bg-brand-500 text-white'
                        : 'bg-brand-50 text-brand-600 border border-brand-100'
                    )}
                  >
                    {child.name}
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* Ad count */}
          {!loading && (
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-ink">
                {searchQuery || selectedCategory
                  ? `${total} ads found`
                  : 'All Ads'
                }
              </h2>
            </div>
          )}

          <AdGrid
            ads={ads}
            loading={loading}
            error={error}
            emptyMessage={
              searchQuery
                ? `No ads found for "${searchQuery}".`
                : 'No ads found in this category yet.'
            }
          />

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary px-4 py-2 disabled:opacity-40"
              >
                ← Previous
              </button>
              <span className="text-sm text-ink-secondary px-4">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-secondary px-4 py-2 disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
