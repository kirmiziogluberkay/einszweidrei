// force-rebuild-v1
/**
 * app/page.js
 * ─────────────────────────────────────────────────────
 * Home page — ad listing with sidebar category tree,
 * search bar, and category filter.
 * ─────────────────────────────────────────────────────
 */

'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAds } from '@/hooks/useAds';
import { useCategories } from '@/hooks/useCategories';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/helpers';
import ErrorBoundary from '@/components/ErrorBoundary';

// Lazy load components
const AdGrid = dynamic(() => import('@/components/ads/AdGrid'), {
  loading: () => <div>Loading ads...</div>
});
const FeedbackBox = dynamic(() => import('@/components/FeedbackBox'), {
  loading: () => <div>Loading feedback...</div>
});
const QuestionOfTheDay = dynamic(() => import('@/components/polls/QuestionOfTheDay'), {
  loading: () => <div>Loading poll...</div>
});

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qParam = searchParams.get('q') || '';

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState(null);
  const [searchQuery, setSearchQuery] = useState(qParam);
  const sentinelRef = useRef(null);

  useEffect(() => {
     setSearchQuery(qParam);
  }, [qParam]);
  const [expandedRoots, setExpandedRoots] = useState({});
  const [maxPriceApplied, setMaxPriceApplied] = useState(null);
  const [maxPriceLocal, setMaxPriceLocal] = useState(6000);
  const [minPriceApplied, setMinPriceApplied] = useState(null);
  const [minPriceLocal, setMinPriceLocal] = useState(0);
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState(['Cash', 'PayPal', 'Free']);

  const { categoryTree } = useCategories();

  const { ads, loading, error, total, fetchNextPage, hasNextPage, isFetchingNextPage } = useAds({
    categoryId: selectedCategoryIds ? null : selectedCategory,
    categoryIds: selectedCategoryIds ?? undefined,
    searchQuery,
    minPrice: minPriceApplied,
    maxPrice: maxPriceApplied,
    paymentMethods: selectedPaymentMethods,
  });

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage(); },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const toggleRoot = (id) =>
    setExpandedRoots(prev => ({ ...prev, [id]: !prev[id] }));

  const handleCategorySelect = (categoryId, parentCat = null) => {
    setSelectedCategory(categoryId);
    if (parentCat && parentCat.children?.length > 0) {
      const ids = [parentCat.id, ...parentCat.children.map(c => c.id)];
      setSelectedCategoryIds(ids);
    } else {
      setSelectedCategoryIds(null);
    }
  };

  const handleSearchClear = () => {
    router.push('/');
  };

  const handlePaymentMethodChange = (method) => {
    setSelectedPaymentMethods((prev) => {
      const next = prev.includes(method)
        ? prev.filter((m) => m !== method)
        : [...prev, method];
      return next;
    });
  };

  return (
    <div className="container-app py-8">


      {/* ── Top Section (Question of the Day) ── */}
      <section className="mb-8 max-w-lg mx-auto">
         <QuestionOfTheDay />

        {searchQuery && (
          <div className="flex items-center justify-center gap-2 mt-4 bg-brand-50/50 py-2 px-4 rounded-xl border border-brand-100">
            <span className="text-sm text-ink-secondary">
              Search Results for "<span className="font-bold text-ink">{searchQuery}</span>" ({total} ads)
            </span>
            <button
              onClick={handleSearchClear}
              className="text-xs font-bold text-brand-600 hover:text-brand-800 underline ml-2"
            >
              Clear Search
            </button>
          </div>
        )}
      </section>

      {/* ── Main layout: sidebar + content ── */}
      <div className="flex gap-4">

        {/* ── LEFT SIDEBAR: Category Tree ── */}
        <aside className="hidden md:block w-56 flex-shrink-0">
          <ErrorBoundary fallback={<div className="sticky top-20 p-4 text-xs text-ink-tertiary">Categories unavailable.</div>}>
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

            <FeedbackBox />
          </div>
          </ErrorBoundary>
        </aside>

        {/* ── RIGHT: Ads ── */}
        <div className="flex-1 min-w-0">

          {/* Mobile category pills */}
          <ErrorBoundary fallback={null}>
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
          </ErrorBoundary>

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

          <div ref={sentinelRef} className="h-10 mt-4 flex items-center justify-center">
            {isFetchingNextPage && <span className="text-xs text-ink-tertiary">Loading...</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
