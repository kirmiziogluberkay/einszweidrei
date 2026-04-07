/**
 * app/ara/page.js
 * ─────────────────────────────────────────────────────
 * Arama sayfası — URL parametresiyle arama yapılır.
 * ?q=laptop gibi GET parametresi desteklenir.
 * ─────────────────────────────────────────────────────
 */

'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { useAds } from '@/hooks/useAds';
import AdGrid from '@/components/ads/AdGrid';

import { Suspense } from 'react';

function AraContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  /** URL'den gelen arama terimi */
  const urlQuery = searchParams.get('q') ?? '';

  const [inputValue, setInputValue] = useState(urlQuery);
  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [page, setPage] = useState(1);

  const { ads, loading, error, total, totalPages } = useAds({ searchQuery, page });

  // URL değiştiğinde state'i güncelle
  useEffect(() => {
    setSearchQuery(urlQuery);
    setInputValue(urlQuery);
    setPage(1);
  }, [urlQuery]);

  /**
   * Arama formunu gönderir ve URL'i günceller.
   * @param {React.FormEvent} e
   */
  const handleSearch = (e) => {
    e.preventDefault();
    setSearchQuery(inputValue);
    setPage(1);
    router.push(`/ara?q=${encodeURIComponent(inputValue)}`);
  };

  return (
    <div className="container-app py-8">
      <h1 className="section-title">İlan Ara</h1>

      {/* Arama formu */}
      <form onSubmit={handleSearch} className="flex gap-2 max-w-xl mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-tertiary" />
          <input
            id="search-input"
            type="search"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ne arıyorsunuz?"
            className="input pl-12 py-3.5 text-base"
            autoFocus
          />
        </div>
        <button type="submit" className="btn-primary px-6">Ara</button>
      </form>

      {/* Sonuç sayısı */}
      {searchQuery && !loading && (
        <p className="text-sm text-ink-secondary mb-5">
          "<span className="font-medium text-ink">{searchQuery}</span>" için{' '}
          <span className="font-medium">{total}</span> sonuç bulundu.
        </p>
      )}

      <AdGrid
        ads={ads}
        loading={loading}
        error={error}
        emptyMessage={
          searchQuery
            ? `"${searchQuery}" ile ilgili ilan bulunamadı.`
            : 'Aramak için yukarıdaki alana yazın.'
        }
      />

      {/* Sayfalama */}
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

export default function AraPage() {
  return (
    <Suspense fallback={<div className="container-app py-8 flex justify-center"><p>Yükleniyor...</p></div>}>
      <AraContent />
    </Suspense>
  );
}
