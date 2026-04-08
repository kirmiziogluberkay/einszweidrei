// force-rebuild-v1
/**
 * components/ads/AdCard.jsx
 * ─────────────────────────────────────────────────────
 * Component that displays a single ad in a card format.
 * Used within a grid on the homepage and search pages.
 * ─────────────────────────────────────────────────────
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Clock, Tag } from 'lucide-react';
import { formatPrice, buildAdUrl, timeAgo, formatUsername, cn } from '@/lib/helpers';
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
 *     category: { name: string, slug: string },
 *     payment_methods: string[],
 *     tags: string[]
 *   },
 *   layout?: 'grid' | 'list'
 * }} props
 */
export default function AdCard({ ad, layout = 'grid' }) {
  if (!ad) return null;

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
    payment_methods = [],
  } = ad;

  /** Link to the ad detail page */
  const adUrl = buildAdUrl(serial_number);

  /** Cover image to display (if any) */
  const coverImage = images?.[0] ?? null;

  /** Ad status info */
  const statusInfo = AD_STATUSES[status] ?? AD_STATUSES.active;

  if (layout === 'list') {
    return (
      <Link
        href={adUrl}
        className="card group flex flex-col md:flex-row gap-6 p-4 hover:shadow-md transition-shadow"
        aria-label={`Go to ${title}`}
      >
        {/* ── Left: Image ── */}
        <div className="relative w-full md:w-64 h-48 md:h-auto bg-surface-secondary rounded-xl overflow-hidden flex-shrink-0">
          {coverImage ? (
            <Image
              src={coverImage}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-surface-tertiary text-ink-tertiary">
              <svg className="w-10 h-10 mb-2 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14 m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs font-medium uppercase opacity-60">No Image</span>
            </div>
          )}
          {/* Status Ribbon (for Active) */}
          {status === 'active' && (
            <div className="absolute top-0 right-0 z-10 w-16 h-16 overflow-hidden pointer-events-none rounded-tr-xl">
              <div className="absolute top-0 right-0 bg-green-500 text-white text-[9px] font-bold py-1 w-[140%] 
                              text-center shadow-md border-b border-green-600
                              translate-x-[28%] translate-y-[28%] rotate-45 origin-center">
                {statusInfo.label}
              </div>
            </div>
          )}
          
          {/* Status Badge (Text only for others) */}
          {status !== 'active' && (
            <div className="absolute top-3 right-3 z-10">
              <span className={cn(
                "text-[10px] font-bold block",
                status === 'reserved' ? "text-amber-500" :
                status === 'rented'   ? "text-blue-500" :
                "text-ink-tertiary"
              )}>
                {statusInfo.label}
              </span>
            </div>
          )}
          {status !== 'active' && <div className="absolute inset-0 bg-black/10" />}
        </div>

        {/* ── Right: Content ── */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex justify-between items-start gap-4">
            <div className="min-w-0 flex-1">
              {category && (
                <div className="flex items-center gap-1 text-xs text-brand-600 font-medium mb-1">
                  <Tag className="w-3 h-3" />
                  <span>{category.name}</span>
                </div>
              )}
              <h3 className="font-bold text-ink text-xl leading-tight group-hover:text-brand-500 transition-colors line-clamp-2">
                {title}
              </h3>
            </div>
            <div className="flex-shrink-0 text-right">
              {(!price || price === 0) ? (
                <span className="font-bold text-green-500 text-[10px] leading-none uppercase tracking-wider">Free</span>
              ) : (
                <span className="font-bold text-ink text-2xl leading-none">{formatPrice(price, currency)}</span>
              )}
            </div>
          </div>

          <p className="text-sm text-ink-secondary mt-3 line-clamp-3">
            {description}
          </p>

          {/* Payment Methods (Above bottom) */}
          {payment_methods && payment_methods.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-auto pt-3 border-t border-surface-tertiary/30">
              {payment_methods.map((m, idx) => (
                <span key={idx} className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${m?.toLowerCase() === 'paypal' ? 'bg-blue-50 text-blue-600' : 'bg-surface-tertiary text-ink-secondary'
                  }`}>
                  {m?.toLowerCase() === 'paypal' ? 'PayPal' : (m?.toLowerCase() === 'cash' ? 'Cash' : m)}
                </span>
              ))}
            </div>
          )}

          {/* Ad Info (Bottom) */}
          <div className="flex items-center pt-4 mt-4 border-t border-surface-tertiary/50">
            <div className="flex items-center gap-1 text-xs text-ink-tertiary">
              <Clock className="w-3.5 h-3.5" />
              <span>{timeAgo(created_at)}</span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // ─── Default Grid Layout ───
  return (
    <Link
      href={adUrl}
      className="group card flex flex-col h-full hover:shadow-md transition-shadow relative overflow-hidden"
      aria-label={`Go to ${title}`}
    >
      {/* Aspect Ratio 4:3 Image Container */}
      <div className="relative aspect-[4/3] bg-surface-secondary overflow-hidden shrink-0">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-surface-tertiary text-ink-tertiary">
            <svg className="w-12 h-12 mb-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14 m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs font-semibold uppercase tracking-wider opacity-60">No Image</span>
          </div>
        )}

        {/* Status Ribbon (for Active) */}
        {status === 'active' && (
          <div className="absolute top-0 right-0 z-10 w-20 h-20 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold py-1.5 w-[140%] 
                            text-center shadow-md border-b border-green-600
                            translate-x-[28%] translate-y-[28%] rotate-45 origin-center">
              {statusInfo.label}
            </div>
          </div>
        )}

        {/* Status Badge (Text only for others) */}
        {status !== 'active' && (
          <div className="absolute top-4 right-4 z-10">
            <span className={cn(
              "text-[10px] font-bold",
              status === 'active'   ? "text-green-500" :
              status === 'reserved' ? "text-amber-500" :
              status === 'rented'   ? "text-blue-500" :
              "text-ink-tertiary"
            )}>
              {statusInfo.label}
            </span>
          </div>
        )}

        {/* Gray overlay for passive ads */}
        {status !== 'active' && (
          <div className="absolute inset-0 bg-black/10 backdrop-grayscale-[0.5]" />
        )}
      </div>

      {/* Content Container */}
      <div className="p-4 flex flex-col flex-1 min-h-0">
        <div className="flex flex-col gap-1.5 mb-3">
          <div className="flex items-center justify-between gap-2">
            {(!price || price === 0) ? (
              <span className="font-bold text-green-500 text-[11px] uppercase tracking-wider">Free</span>
            ) : (
              <span className="font-bold text-ink text-lg leading-none">{formatPrice(price, currency)}</span>
            )}
            {category && (
              <div className="flex items-center gap-1 text-[11px] text-brand-600 font-bold bg-brand-50 px-2 py-1 rounded-lg border border-brand-100">
                <Tag className="w-3 h-3" />
                <span className="truncate max-w-[80px]">{category.name}</span>
              </div>
            )}
          </div>
          <h3 className="font-bold text-ink text-sm leading-tight group-hover:text-brand-500 transition-colors line-clamp-2">
            {title}
          </h3>
        </div>
        <div className="flex flex-col gap-2 mt-auto">
          {/* Payment Methods (Above bottom) */}
          {payment_methods && payment_methods.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-auto pt-3 border-t border-surface-tertiary/30">
              {payment_methods.map((m, idx) => (
                <span key={idx} className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${m?.toLowerCase() === 'paypal' ? 'bg-blue-50 text-blue-600' : 'bg-surface-tertiary text-ink-secondary'
                  }`}>
                  {m?.toLowerCase() === 'paypal' ? 'PayPal' : (m?.toLowerCase() === 'cash' ? 'Cash' : m)}
                </span>
              ))}
            </div>
          )}

          {/* Ad Info (Bottom) */}
          <div className="flex items-center justify-between pt-3 border-t border-surface-tertiary/50">
            <div className="flex items-center gap-1 text-xs text-ink-tertiary">
              <Clock className="w-3.5 h-3.5" />
              <span>{timeAgo(created_at)}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
