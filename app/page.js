/**
 * app/page.js
 * ─────────────────────────────────────────────────────
 * Ana sayfa — ilan listesi, kategori filtreleme ve arama.
 * ─────────────────────────────────────────────────────
 */

'use client';

import { useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useAds } from '@/hooks/useAds';
import { useCategories } from '@/hooks/useCategories';
import AdGrid from '@/components/ads/AdGrid';
import { SITE_TAGLINE, ADS_PER_PAGE } from '@/constants/config';
import { cn } from '@/lib/helpers';

export default function HomePage() {
  /** Aktif kategori filtresi (null = tümü) */
  const [selectedCategory, setSelectedCategory] = useState(null);

  /** Arama sorgusu */
  const [searchQuery, setSearchQuery] = useState('');

  /** Arama formu input değeri (submit öncesi) */
  const [searchInput, setSearchInput] = useState('');

  /** Geçerli sayfa */
  const [page, setPage] = useState(1);

  const { categoryTree } = useCategories();

  const { ads, loading, error, total, totalPages } = useAds({
    categoryId: selectedCategory,
    searchQuery,
    page,
  });

  /**
   * Kategori seçildiğinde sayfayı sıfırla.
   * @param {string|null} categoryId
   */
  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    setPage(1);
  };

  /**
   * Arama formunu gönder.
   * @param {React.FormEvent} e
   */
  const handleSearch = (e) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setPage(1);
  };

  return (
    <div className="container-app py-8">

      {/* ── Hero başlık ── */}
      <section className="text-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-bold gradient-text mb-3">
          {SITE_TAGLINE}
        </h1>
        <p className="text-ink-secondary text-lg max-w-xl mx-auto">
          Güvenli, hızlı ve kolay alışveriş deneyimi için doğru adrestesiniz.
        </p>
      </section>

      {/* ── Arama çubuğu ── */}
      <section className="mb-8">
        <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl mx-auto">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-tertiary" />
            <input
              id="home-search"
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="İlan ara..."
              className="input pl-11 py-3.5 text-base"
            />
          </div>
          <button type="submit" className="btn-primary px-6 py-3.5">Ara</button>
        </form>

        {/* Aktif arama etiketi */}
        {searchQuery && (
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="text-sm text-ink-secondary">
              "<span className="font-medium text-ink">{searchQuery}</span>" için sonuçlar ({total} ilan)
            </span>
            <button
              onClick={() => { setSearchQuery(''); setSearchInput(''); setPage(1); }}
              className="text-xs text-brand-500 hover:underline"
            >
              Temizle
            </button>
          </div>
        )}
      </section>

      {/* ── Kategori filtreleri ── */}
      <section className="mb-8">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">

          {/* "Tümü" butonu */}
          <button
            onClick={() => handleCategorySelect(null)}
            id="category-all"
            className={cn(
              'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all',
              selectedCategory === null
                ? 'bg-ink text-white'
                : 'bg-white text-ink-secondary border border-surface-tertiary hover:border-ink-tertiary'
            )}
          >
            Tümü
          </button>

          {/* Üst kategoriler */}
          {categoryTree.map((parent) => (
            <div key={parent.id} className="flex items-center gap-1">
              <button
                onClick={() => handleCategorySelect(parent.id)}
                id={`category-${parent.slug}`}
                className={cn(
                  'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all',
                  selectedCategory === parent.id
                    ? 'bg-ink text-white'
                    : 'bg-white text-ink-secondary border border-surface-tertiary hover:border-ink-tertiary'
                )}
              >
                {parent.name}
              </button>

              {/* Alt kategoriler */}
              {parent.children?.map((child) => (
                <button
                  key={child.id}
                  onClick={() => handleCategorySelect(child.id)}
                  id={`category-${child.slug}`}
                  className={cn(
                    'flex-shrink-0 px-4 py-2 rounded-full text-sm transition-all',
                    selectedCategory === child.id
                      ? 'bg-brand-500 text-white'
                      : 'bg-brand-50 text-brand-600 border border-brand-100 hover:border-brand-300'
                  )}
                >
                  {child.name}
                </button>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ── İlan sayısı başlığı ── */}
      {!loading && (
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-ink">
            {searchQuery || selectedCategory
              ? `${total} ilan bulundu`
              : 'Tüm İlanlar'
            }
          </h2>
        </div>
      )}

      {/* ── İlan ızgarası ── */}
      <AdGrid
        ads={ads}
        loading={loading}
        error={error}
        emptyMessage={
          searchQuery
            ? `"${searchQuery}" için ilan bulunamadı.`
            : 'Bu kategoride henüz ilan bulunmuyor.'
        }
      />

      {/* ── Sayfalama ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-10">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-secondary px-4 py-2 disabled:opacity-40"
          >
            ← Önceki
          </button>

          <span className="text-sm text-ink-secondary px-4">
            {page} / {totalPages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="btn-secondary px-4 py-2 disabled:opacity-40"
          >
            Sonraki →
          </button>
        </div>
      )}
    </div>
  );
}
