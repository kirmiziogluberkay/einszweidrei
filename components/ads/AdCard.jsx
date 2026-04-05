/**
 * components/ads/AdCard.jsx
 * ─────────────────────────────────────────────────────
 * Tek bir ilanı kart formatında gösteren bileşen.
 * Ana sayfada grid içinde kullanılır.
 * ─────────────────────────────────────────────────────
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Clock, Tag } from 'lucide-react';
import { formatPrice, buildAdUrl, timeAgo, truncateText } from '@/lib/helpers';
import { AD_STATUSES } from '@/constants/config';

/**
 * @param {{
 *   ad: {
 *     id: string,
 *     serial_number: string,
 *     title: string,
 *     description: string,
 *     price: number | null,
 *     currency: string,
 *     images: string[],
 *     status: string,
 *     created_at: string,
 *     owner: { username: string },
 *     category: { name: string, slug: string }
 *   }
 * }} props
 */
export default function AdCard({ ad }) {
  const {
    serial_number,
    title,
    description,
    price,
    currency,
    images,
    status,
    created_at,
    owner,
    category,
  } = ad;

  /** İlanın detail sayfası linki */
  const adUrl = buildAdUrl(serial_number);

  /** Gösterilecek kapak fotoğrafı (varsa) */
  const coverImage = images?.[0] ?? null;

  /** İlan durum bilgisi */
  const statusInfo = AD_STATUSES[status] ?? AD_STATUSES.active;

  return (
    <Link
      href={adUrl}
      className="card group block"
      aria-label={`${title} ilanına git`}
    >
      {/* ── Fotoğraf alanı ── */}
      <div className="relative aspect-[4/3] bg-surface-secondary overflow-hidden">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          /* Fotoğraf yoksa gelişmiş placeholder */
          <div className="w-full h-full flex flex-col items-center justify-center bg-surface-tertiary text-ink-tertiary">
            <svg className="w-10 h-10 mb-2 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14
                   m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs font-medium uppercase tracking-wider opacity-60">No Image</span>
          </div>
        )}

        {/* Fotoğraf sayısı badge */}
        {images?.length > 1 && (
          <span className="absolute bottom-2 right-2 badge bg-black/50 text-white text-xs">
            +{images.length - 1}
          </span>
        )}

        {/* Pasif/satıldı overlay */}
        {status !== 'active' && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white text-ink text-xs font-semibold px-3 py-1 rounded-full">
              {statusInfo.label}
            </span>
          </div>
        )}
      </div>

      {/* ── Kart içeriği ── */}
      <div className="p-4 space-y-2">

        {/* Kategori etiketi */}
        {category && (
          <div className="flex items-center gap-1 text-xs text-ink-tertiary">
            <Tag className="w-3 h-3" />
            <span>{category.name}</span>
          </div>
        )}

        {/* Başlık */}
        <h3 className="font-semibold text-ink text-base leading-snug line-clamp-2
                       group-hover:text-brand-500 transition-colors">
          {title}
        </h3>

        {/* Açıklama önizlemesi kullanıcının talebi üzerine kaldırıldı */}

        {/* Alt bilgiler */}
        <div className="flex items-center justify-between pt-1">
          {/* Fiyat - Free in green if no price given */}
          {(!price || price === 0) ? (
            <span className="font-bold text-green-500 text-lg">Free</span>
          ) : (
            <span className="font-bold text-ink text-lg">
              {formatPrice(price, currency)}
            </span>
          )}

          {/* Zaman */}
          <div className="flex items-center gap-1 text-xs text-ink-tertiary">
            <Clock className="w-3.5 h-3.5" />
            <span>{timeAgo(created_at)}</span>
          </div>
        </div>

        {/* İlan sahibi önizlemesi kullanıcının talebi üzerine kaldırıldı */}
      </div>
    </Link>
  );
}
