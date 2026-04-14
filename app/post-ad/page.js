/**
 * app/post-ad/page.js — Protected by middleware
 */

import AdForm from '@/components/ads/AdForm';

export const metadata = {
  title:       'Post Ad',
  description: 'Create a new ad and sell or rent out your items.',
};

export default function PostAdPage() {
  return (
    <div className="container-app py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ink">Post Ad</h1>
        <p className="text-ink-secondary mt-2">Create and publish your ad in just a few minutes.</p>
      </div>
      <div className="card p-6 sm:p-8">
        <AdForm />
      </div>
    </div>
  );
}
