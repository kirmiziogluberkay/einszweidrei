/**
 * app/kategori/[slug]/KategoriClient.jsx
 * ─────────────────────────────────────────────────────
 * Client-side part of the category page.
 * Ad listing and pagination.
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
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState(['Cash', 'PayPal', 'Free']);
  const [page, setPage] = useState(1);

  const { ads, loading, error, total, totalPages } = useAds({
    categoryId: category.id,
    paymentMethods: selectedPaymentMethods,
    page,
  });

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

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-ink-tertiary mb-6">
        <Link href="/" className="hover:text-ink transition-colors">Home</Link>
        <span>/</span>
        {category.parent && (
          <>
            <Link href={`/kategori/${category.parent.slug}`} className="hover:text-ink transition-colors font-medium">
              {category.parent.name}
            </Link>
            <span className="opacity-40">/</span>
          </>
        )}
        <span className="text-ink font-medium">{category.name}</span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar: Filters */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-surface p-6 rounded-2xl border border-surface-secondary sticky top-24">
            <h2 className="text-sm font-semibold text-ink uppercase tracking-wider mb-4">Payment Method</h2>
            <div className="space-y-3">
              {['Cash', 'PayPal', 'Free'].map((method) => (
                <label key={method} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedPaymentMethods.includes(method)}
                    onChange={() => handlePaymentMethodChange(method)}
                    className="w-5 h-5 rounded border-surface-tertiary text-brand-500 focus:ring-brand-500 transition-colors"
                  />
                  <span className="text-sm text-ink-secondary group-hover:text-ink transition-colors font-medium">
                    {method}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
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
            layout="list"
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
