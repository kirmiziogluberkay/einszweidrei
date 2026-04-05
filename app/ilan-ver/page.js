/**
 * app/ilan-ver/page.js
 * ─────────────────────────────────────────────────────
 * Yeni ilan oluşturma sayfası.
 * Middleware tarafından korunur — giriş zorunlu.
 * ─────────────────────────────────────────────────────
 */

import AdForm from '@/components/ads/AdForm';

/** @type {import('next').Metadata} */
export const metadata = {
  title: 'İlan Ver',
  description: 'Yeni ilan oluştur ve eşyalarını sat ya da kiraya ver.',
};

export default function IlanVerPage() {
  return (
    <div className="container-app py-8 max-w-2xl">

      {/* Sayfa başlığı */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ink">İlan Ver</h1>
        <p className="text-ink-secondary mt-2">
          Birkaç dakikada ilanınızı oluşturup yayınlayın.
        </p>
      </div>

      {/* İlan formu */}
      <div className="card p-6 sm:p-8">
        <AdForm />
      </div>
    </div>
  );
}
