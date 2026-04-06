/**
 * app/ilan/[seriNo]/page.js
 * ─────────────────────────────────────────────────────
 * İlan detay sayfası.
 * URL: /ilan/[SERI-NO]
 *
 * - Fotoğraf galerisii
 * - İlan bilgileri
 * - WhatsApp & Telegram paylaşım
 * - İlan sahibine mesaj gönderme
 * ─────────────────────────────────────────────────────
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import ShareButtons from '@/components/ads/ShareButtons';
import { CheckCircle2, PencilLine } from 'lucide-react';
import AdDetailClient from './AdDetailClient';
import ContactButton from './ContactButton';
import { formatPrice, formatDate } from '@/lib/helpers';
import { AD_STATUSES } from '@/constants/config';

/** SEO için dinamik metadata üret */
export async function generateMetadata({ params }) {
  const supabase = await createClient();

  const { data: ad } = await supabase
    .from('ads')
    .select('title, description, images')
    .eq('serial_number', params.seriNo)
    .single();

  if (!ad) return { title: 'Ad Not Found' };

  return {
    title:       ad.title,
    description: ad.description?.slice(0, 155),
    openGraph: {
      title:  ad.title,
      description: ad.description?.slice(0, 155),
      images: ad.images?.[0] ? [{ url: ad.images[0] }] : [],
    },
  };
}

/**
 * Sunucu bileşeni — veriyi çeker ve istemci bileşenine aktarır.
 */
export default async function AdDetailPage({ params }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // İlanı tüm ilgili verilerle çek
  const { data: ad } = await supabase
    .from('ads')
    .select(`
      id,
      serial_number,
      title,
      description,
      price,
      currency,
      images,
      status,
      payment_methods,
      payment_methods,
      created_at,
      updated_at,
      owner:profiles!owner_id(id, username, phone),
      category:categories(id, name, slug, parent:categories!parent_id(id, name, slug))
    `)
    .eq('serial_number', params.seriNo)
    .single();

  // İlan bulunamadıysa 404
  if (!ad) notFound();

  const statusInfo = AD_STATUSES[ad.status] ?? AD_STATUSES.active;

  return (
    <div className="container-app py-8">

      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-2 text-sm text-ink-tertiary mb-6" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink transition-colors">Home</Link>
        <span>/</span>
        {ad.category?.parent && (
          <>
            <Link href={`/kategori/${ad.category.parent.slug}`} className="hover:text-ink transition-colors">
              {ad.category.parent.name}
            </Link>
            <span>/</span>
          </>
        )}
        {ad.category && (
          <>
            <Link href={`/kategori/${ad.category.slug}`} className="hover:text-ink transition-colors">
              {ad.category.name}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-ink font-medium truncate max-w-[200px]">{ad.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

        {/* ── Sol: Fotoğraf galerisi + bilgiler ── */}
        <div className="lg:col-span-3 space-y-6">

          {/* Fotoğraf galerisi (Client Component) */}
          <AdDetailClient images={ad.images} title={ad.title} />

          {/* Açıklama */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-ink mb-4">Description</h2>
            <p className="text-ink-secondary text-sm leading-relaxed whitespace-pre-wrap">
              {ad.description || 'Description not provided.'}
            </p>
          </div>

          {/* Paylaşım butonları */}
          <div className="card p-5">
            <ShareButtons title={ad.title} serialNumber={ad.serial_number} />
          </div>
        </div>

        {/* ── Sağ: İlan özeti + iletişim ── */}
        <aside className="lg:col-span-2 space-y-4">

          {/* İlan özeti kartı */}
          <div className="card p-6 space-y-4">
            
            {/* Owner Actions */}
            {user?.id === ad.owner_id && (
              <Link
                href={`/ilan/${ad.serial_number}/duzenle`}
                className="w-full btn-secondary flex items-center justify-center gap-2 py-3 border-brand-200 text-brand-600 hover:bg-brand-50"
              >
                <PencilLine className="w-4 h-4" />
                Edit Ad
              </Link>
            )}

            {/* Durum badge */}
            {ad.status !== 'active' && (
              <span className={`badge ${
                ad.status === 'sold' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
              }`}>
                {statusInfo.label}
              </span>
            )}

            {/* Başlık */}
            <h1 className="text-2xl font-bold text-ink leading-tight">{ad.title}</h1>

            {/* Fiyat */}
            <p className="text-3xl font-bold text-brand-500">
              {formatPrice(ad.price, ad.currency)}
            </p>

            {/* Meta bilgiler */}
            <div className="divider" />
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-secondary">Serial No</dt>
                <dd className="font-mono font-medium text-ink">{ad.serial_number}</dd>
              </div>
              {ad.category && (
                <div className="flex justify-between">
                  <dt className="text-ink-secondary">Category</dt>
                  <dd className="text-ink">{ad.category.name}</dd>
                </div>
              )}
                  <div className="flex justify-between">
                    <dt className="text-ink-secondary">Ad Date</dt>
                    <dd className="text-ink">{formatDate(ad.created_at)}</dd>
                  </div>
                </dl>

            {/* Payment Methods */}
            {ad.payment_methods && ad.payment_methods.length > 0 && (
              <div className="pt-5 border-t border-dashed border-surface-tertiary">
                <h4 className="text-[11px] font-bold text-ink-tertiary uppercase tracking-[0.1em] mb-3 flex items-center gap-2">
                  <div className="w-1 h-3 bg-brand-500 rounded-full" />
                  Payment Methods
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {ad.payment_methods.map(method => (
                    <div key={method} className="flex items-center gap-2 px-3 py-2 bg-surface-secondary rounded-xl border border-surface-tertiary/50">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium text-ink-secondary">{method}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* İlan sahibi + mesaj */}
          <div className="card p-6">
            <h3 className="text-base font-semibold text-ink mb-4">Seller Information</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600
                              flex items-center justify-center font-bold text-sm">
                {ad.owner?.username?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-ink text-sm">{ad.owner?.username}</p>
                <p className="text-xs text-ink-tertiary">Member</p>
              </div>
            </div>

            {/* İstemci bileşeni (Client Component) */}
            <ContactButton
              adId={ad.id}
              adTitle={ad.title}
              receiverId={ad.owner?.id}
              receiverName={ad.owner?.username}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
