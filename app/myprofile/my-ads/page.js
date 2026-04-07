// force-rebuild-v1
// update 22:46: img changed to Image. next/image import added.
/**
 * app/myprofile/my-ads/page.js
 * ─────────────────────────────────────────────────────
 * User's own ads listing page.
 * URL: /myprofile/my-ads
 * ─────────────────────────────────────────────────────
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2, Edit3, Trash2, Eye, Plus, AlertCircle, Lock, Unlock, CheckCircle, Circle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAds } from '@/hooks/useAds';
import { useCategories } from '@/hooks/useCategories';
import { formatPrice, buildAdUrl, timeAgo } from '@/lib/helpers';
import { SUCCESS_MESSAGES, ERROR_MESSAGES, AD_STATUSES, AD_URL_PREFIX } from '@/constants/config';

export default function MyAdsPage() {
  const supabase = createClient();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { categories } = useCategories();

  // ── Auth Guard ──
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const { ads, loading: adsLoading, refetch } = useAds(
    user?.id ? { owner_id: user.id } : { skip: true }
  );

  const [msg, setMsg] = useState(null);
  const [msgType, setMsgType] = useState('success');

  // ── İlanları Grupla ──
  const getRootSlug = (cId) => {
    const cat = categories.find(c => c.id === cId);
    if (!cat) return '';
    if (!cat.parent_id) return cat.slug;
    return getRootSlug(cat.parent_id);
  };

  const soldAds = ads.filter(ad => ad.status === 'sold');
  const rentedAds = ads.filter(ad => ad.status === 'rented');
  const secondHandAds = ads.filter(ad => ad.status !== 'sold' && ad.status !== 'rented' && (getRootSlug(ad.category_id).includes('second-hand') || (!getRootSlug(ad.category_id).includes('second-hand') && !getRootSlug(ad.category_id).includes('rental'))));
  const rentalAds = ads.filter(ad => ad.status !== 'sold' && ad.status !== 'rented' && getRootSlug(ad.category_id).includes('rental'));

  const handleDeleteAd = async (adId) => {
    if (!confirm('Are you sure you want to delete this ad?')) return;

    const { error } = await supabase
      .from('ads')
      .delete()
      .eq('id', adId)
      .eq('owner_id', user.id);

    if (!error) {
      setMsg(SUCCESS_MESSAGES.adDeleted);
      setMsgType('success');
      refetch();
    } else {
      setMsg(ERROR_MESSAGES.generic);
      setMsgType('error');
    }
  };

  const handleToggleStatus = async (adId, currentStatus, categoryId) => {
    const findRootSlug = (cId) => {
      const cat = categories.find(c => c.id === cId);
      if (!cat) return '';
      if (!cat.parent_id) return cat.slug;
      return findRootSlug(cat.parent_id);
    };

    const rootSlug = findRootSlug(categoryId).toLowerCase();
    let targetStatus = 'passive';
    if (rootSlug.includes('rental')) targetStatus = 'rented';
    else if (rootSlug.includes('second-hand')) targetStatus = 'reserved';

    const newStatus = currentStatus === 'active' ? targetStatus : 'active';

    const { error } = await supabase
      .from('ads')
      .update({ status: newStatus })
      .eq('id', adId)
      .eq('owner_id', user.id);

    if (!error) {
      refetch();
    } else {
      setMsg('Update failed: ' + error.message);
      setMsgType('error');
    }
  };

  const handleMarkSold = async (adId, currentStatus) => {
    const newStatus = currentStatus === 'sold' ? 'active' : 'sold';
    const { error } = await supabase
      .from('ads')
      .update({ status: newStatus })
      .eq('id', adId)
      .eq('owner_id', user.id);

    if (!error) refetch();
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="container-app py-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ink">My Ads</h1>
      </div>

      {msg && (
        <div className={`flex items-start gap-2 p-4 rounded-2xl text-sm mb-6 ${msgType === 'success'
            ? 'bg-green-50 border border-green-100 text-green-600'
            : 'bg-red-50 border border-red-100 text-red-600'
          }`}>
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {adsLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-24 rounded-2xl" />
          ))}
        </div>
      ) : ads.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-ink-secondary mb-4">You haven't posted any ads yet.</p>
          <Link href="/post-ad" className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create Your First Ad
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {[
            { title: 'Second Hand Items', list: secondHandAds },
            { title: 'Rental Items', list: rentalAds },
            { title: 'Rented Items', list: rentedAds },
            { title: 'Sold Items', list: soldAds }
          ].map((section) => (
            <div key={section.title}>
              <h3 className="text-[11px] font-bold text-ink uppercase tracking-[0.1em] mb-4 flex items-center gap-2">
                <div className="w-1 h-3 bg-brand-500 rounded-full" />
                {section.title} ({section.list.length})
              </h3>

              {section.list.length > 0 ? (
                <div className="space-y-3">
                  {section.list.map((ad) => {
                    const statusInfo = AD_STATUSES[ad.status] ?? AD_STATUSES.active;
                    return (
                      <div key={ad.id} className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow group">
                        <Link href={`${AD_URL_PREFIX}/${ad.serial_number}`} className="flex-shrink-0">
                          <div className="relative w-16 h-16 rounded-xl bg-surface-secondary overflow-hidden hover:opacity-80 transition-opacity">
                            {ad.images?.[0] ? (
                              <Image
                                src={ad.images[0]}
                                alt={ad.title}
                                fill
                                sizes="64px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-ink-tertiary">
                                <Eye className="w-5 h-5 opacity-20" />
                              </div>
                            )}
                          </div>
                        </Link>

                        <div className="flex-1 min-w-0">
                          <Link href={`${AD_URL_PREFIX}/${ad.serial_number}`} className="text-[14px] font-bold text-ink hover:text-brand-500 transition-colors block truncate">
                            {ad.title}
                          </Link>
                          <p className="text-xs text-ink-secondary mt-1">
                            {timeAgo(ad.created_at)} · <span className="font-semibold text-brand-600">{formatPrice(ad.price, ad.currency)}</span>
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-0.5 ml-2">
                          <span className="text-[9px] font-bold text-ink-tertiary uppercase tracking-wider">Status</span>
                          <span className={`font-bold text-[10px] whitespace-nowrap ${ad.status === 'active' ? 'text-green-600' :
                              ad.status === 'reserved' ? 'text-amber-600' :
                                ad.status === 'rented' ? 'text-blue-600' :
                                  ad.status === 'sold' ? 'text-red-500' :
                                    'text-ink-tertiary'
                            }`}>
                            {statusInfo.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!getRootSlug(ad.category_id).includes('rental') && (
                            <button
                              onClick={() => handleMarkSold(ad.id, ad.status)}
                              title={ad.status === 'sold' ? 'For Sale' : 'Sold'}
                              className={`p-2 rounded-xl transition-colors ${ad.status !== 'sold'
                                  ? 'text-red-500 bg-red-50'
                                  : 'text-ink-tertiary hover:bg-surface-secondary'
                                }`}
                            >
                              {ad.status === 'sold' ? <Circle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                            </button>
                          )}
                          <button
                            onClick={() => handleToggleStatus(ad.id, ad.status, ad.category_id)}
                            title="Toggle Reserved/Rented"
                            className={`p-2 rounded-xl transition-colors ${(ad.status === 'reserved' || ad.status === 'rented')
                                ? 'text-brand-500 bg-brand-50'
                                : 'text-ink-tertiary hover:text-brand-500 hover:bg-surface-secondary'
                              }`}
                          >
                            {ad.status === 'active' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                          </button>
                          <Link
                            href={`${AD_URL_PREFIX}/${ad.serial_number}/duzenle`}
                            className="p-2 rounded-xl text-ink-tertiary hover:text-brand-500 hover:bg-brand-50 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDeleteAd(ad.id)}
                            className="p-2 rounded-xl text-ink-tertiary hover:text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
