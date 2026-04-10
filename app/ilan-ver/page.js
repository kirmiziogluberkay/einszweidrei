/**
 * app/ilan-ver/page.js
 * ─────────────────────────────────────────────────────
 * Yeni ilan oluşturma sayfası.
 * Middleware tarafından korunur — giriş zorunlu.
 * ─────────────────────────────────────────────────────
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdForm from '@/components/ads/AdForm';

/** @type {import('next').Metadata} */
export const metadata = {
  title: 'Post Ad',
  description: 'Create a new ad and sell or rent out your items.',
};

export default async function IlanVerPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

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

