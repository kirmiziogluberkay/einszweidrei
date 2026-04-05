/**
 * app/post-ad/page.js
 * ─────────────────────────────────────────────────────
 * New ad creation page.
 * URL: /post-ad
 * Protected by middleware — requires login.
 * ─────────────────────────────────────────────────────
 */

import AdForm from '@/components/ads/AdForm';

/** @type {import('next').Metadata} */
export const metadata = {
  title: 'Post Ad',
  description: 'Create a new ad and sell or rent out your items.',
};

export default function PostAdPage() {
  return (
    <div className="container-app py-8 max-w-2xl">

      {/* Sayfa başlığı */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ink">Post Ad</h1>
        <p className="text-ink-secondary mt-2">
          Create and publish your ad in just a few minutes.
        </p>
      </div>

      {/* İlan formu */}
      <div className="card p-6 sm:p-8">
        <AdForm />
      </div>
    </div>
  );
}
