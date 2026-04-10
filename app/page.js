// force-rebuild-v1
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
import FeedbackBox from '@/components/FeedbackBox';
import QuestionOfTheDay from '@/components/polls/QuestionOfTheDay';
import { cn } from '@/lib/helpers';

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [expandedRoots, setExpandedRoots] = useState({});
  const [maxPriceApplied, setMaxPriceApplied] = useState(null);
  const [maxPriceLocal, setMaxPriceLocal] = useState(6000);
  const [minPriceApplied, setMinPriceApplied] = useState(null);
  const [minPriceLocal, setMinPriceLocal] = useState(0);
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState(['Cash', 'PayPal', 'Free']);

  const { categoryTree } = useCategories();

  const { ads, loading, error, total, totalPages } = useAds({
    categoryId: selectedCategoryIds ? null : selectedCategory,
    categoryIds: selectedCategoryIds ?? undefined,
    searchQuery,
    minPrice: minPriceApplied,
    maxPrice: maxPriceApplied,
    paymentMethods: selectedPaymentMethods,
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

  const handlePaymentMethodChange = (method) => {
    setSelectedPaymentMethods((prev) => {
      const next = prev.includes(method)
        ? prev.filter((m) => m !== method)
        : [...prev, method];
      setPage(1);
      return next;
    });
  };

  return (
    <div className="container-app py-8">


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
              placeholder={`Search among our advertisements...`}
              className="input pl-12 py-3.5 text-base"
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
      <div className="flex gap-4">

        {/* ── LEFT SIDEBAR: Category Tree ── */}
        <aside className="hidden md:block w-56 flex-shrink-0">
          <div className="sticky top-20 bg-white border border-surface-tertiary rounded-2xl p-4 shadow-sm">
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
            
            {/* ── Price Filter ── */}
            <div className="mt-8 border-t border-surface-tertiary pt-6 text-ink">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-ink-secondary mb-3">Price Range</h3>
                
                <div className="flex items-center gap-1.5 mb-5 px-0.5">
                  <div className="flex items-center gap-1 flex-1">
                    <input
                      type="number"
                      min="0"
                      max={maxPriceLocal}
                      value={minPriceLocal}
                      onChange={(e) => {
                        const val = Math.min(Number(e.target.value), maxPriceLocal);
                        setMinPriceLocal(val);
                      }}
                      className="w-full h-8 px-2 text-xs border border-surface-tertiary rounded-lg focus:outline-none focus:border-brand-500 font-normal text-ink bg-white"
                    />
                    <span className="text-[14px] text-ink-tertiary font-bold">€</span>
                  </div>
                  
                  <span className="text-ink-tertiary text-xs">—</span>
                  
                  <div className="flex items-center gap-1 flex-1">
                    <input
                      type="number"
                      min={minPriceLocal}
                      max="6000"
                      value={maxPriceLocal}
                      onChange={(e) => {
                        const val = Math.max(Number(e.target.value), minPriceLocal);
                        setMaxPriceLocal(val > 6000 ? 6000 : val);
                      }}
                      className="w-full h-8 px-2 text-xs border border-surface-tertiary rounded-lg focus:outline-none focus:border-brand-500 font-normal text-ink bg-white"
                    />
                    <span className="text-[14px] text-ink-tertiary font-bold">€</span>
                  </div>
                </div>

                <div className="relative h-6 flex items-center px-1">
                  <div className="absolute left-1 right-1 h-1.5 bg-surface-tertiary rounded-lg" />
                  <input
                    type="range"
                    min="0"
                    max="6000"
                    step="10"
                    value={minPriceLocal}
                    onChange={(e) => setMinPriceLocal(Math.min(Number(e.target.value), maxPriceLocal))}
                    className="absolute left-0 right-0 w-full h-1.5 appearance-none bg-transparent pointer-events-none cursor-pointer accent-brand-500 [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto"
                  />
                  <input
                    type="range"
                    min="0"
                    max="6000"
                    step="10"
                    value={maxPriceLocal}
                    onChange={(e) => setMaxPriceLocal(Math.max(Number(e.target.value), minPriceLocal))}
                    className="absolute left-0 right-0 w-full h-1.5 appearance-none bg-transparent pointer-events-none cursor-pointer accent-brand-500 [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto"
                  />
                </div>
                <div className="flex justify-between text-[10px] text-ink-tertiary mt-1">
                  <span>0€</span>
                  <span>6000€</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setMinPriceApplied(minPriceLocal);
                  setMaxPriceApplied(maxPriceLocal === 6000 ? null : maxPriceLocal);
                  setPage(1);
                }}
                className="w-full btn-primary text-xs py-2.5 rounded-xl shadow-sm"
              >
                Apply Range
              </button>
            </div>

            {/* ── Payment Method ── */}
            <div className="mt-8 border-t border-surface-tertiary pt-6">
              <h3 className="text-sm font-semibold text-ink-secondary mb-4">Payment Method</h3>
              <div className="space-y-3">
                {['Cash', 'PayPal', 'Free'].map((method) => (
                  <label key={method} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedPaymentMethods.includes(method)}
                      onChange={() => handlePaymentMethodChange(method)}
                      className="w-4 h-4 rounded border-surface-tertiary text-brand-500 focus:ring-brand-500 transition-colors"
                    />
                    <span className="text-xs text-ink-secondary group-hover:text-ink transition-colors font-medium">
                      {method}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <QuestionOfTheDay />
            </div>

            <FeedbackBox />
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
          {!loading && (searchQuery || selectedCategory) && (
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-ink">
                {total} ads found
              </h2>
            </div>
          )}

          <AdGrid
            ads={ads}
            loading={loading}
            error={error}
            layout={selectedCategory ? 'list' : 'grid'}
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
