// update 21:23
/**
 * app/myprofile/my-ads/page.js
 * ─────────────────────────────────────────────────────
 * User's own ads listing page.
 * URL: /myprofile/my-ads
 * ─────────────────────────────────────────────────────
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, Edit3, Trash2, Eye, Plus, AlertCircle, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAds } from '@/hooks/useAds';
import { useCategories } from '@/hooks/useCategories';
import { formatPrice, buildAdUrl, timeAgo } from '@/lib/helpers';
import { SUCCESS_MESSAGES, ERROR_MESSAGES, AD_STATUSES, AD_URL_PREFIX } from '@/constants/config';

export default function MyAdsPage() {
  const supabase          = createClient();
  const { user, loading: authLoading } = useAuth();
  const { categories }    = useCategories();

  const { ads, loading: adsLoading, refetch } = useAds({
    owner_id: user?.id,
  });

  const [msg,       setMsg]       = useState(null);
  const [msgType,   setMsgType]   = useState('success');

  // ── İlanları Grupla ──
  const getRootSlug = (cId) => {
    const cat = categories.find(c => c.id === cId);
    if (!cat) return '';
    if (!cat.parent_id) return cat.slug;
    return getRootSlug(cat.parent_id);
  };

  const secondHandAds = ads.filter(ad => getRootSlug(ad.category_id).includes('second-hand'));
  const rentalAds = ads.filter(ad => getRootSlug(ad.category_id).includes('rental'));
  const otherAds = ads.filter(ad => {
    const slug = getRootSlug(ad.category_id);
    return !slug.includes('second-hand') && !slug.includes('rental');
  });

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
    // Kök kategorinin slug değerini bul:
    const findRootSlug = (cId) => {
      const cat = categories.find(c => c.id === cId);
      if (!cat) return '';
      if (!cat.parent_id) return cat.slug;
      return findRootSlug(cat.parent_id);
    };

    const rootSlug = findRootSlug(categoryId).toLowerCase();
    
    // Kök kategoriye Göre Ayrım:
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

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="container-app py-8 max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-ink">My Ads</h1>
        <Link href="/post-ad" className="btn-primary">
          <Plus className="w-4 h-4" /> New Ad
        </Link>
      </div>

      {msg && (
        <div className={`flex items-start gap-2 p-4 rounded-2xl text-sm mb-6 ${
          msgType === 'success'
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
          {/* ── Helpers to render grouped list ── */}
          {[
            { title: 'Second Hand Items', list: secondHandAds },
            { title: 'Rental Items',      list: rentalAds },
            { title: 'Other Listings',    list: otherAds }
          ].map((section) => (
            section.list.length > 0 && (
              <div key={section.title}>
                <h3 className="text-[11px] font-bold text-ink-tertiary uppercase tracking-[0.1em] mb-4 flex items-center gap-2">
                  <div className="w-1 h-3 bg-brand-500 rounded-full" />
                  {section.title} ({section.list.length})
                </h3>
                <div className="space-y-3">
                  {section.list.map((ad) => {
                    const statusInfo = AD_STATUSES[ad.status] ?? AD_STATUSES.active;
                    return (
                      <div key={ad.id} className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow group">
                        <div className="relative w-16 h-16 rounded-xl bg-surface-secondary flex-shrink-0 overflow-hidden">
                          {ad.images?.[0] ? (
                            <img src={ad.images[0]} alt={ad.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-ink-tertiary">
                              <Plus className="w-5 h-5 opacity-20" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <Link href={`${AD_URL_PREFIX}/${ad.serial_number}`} className="font-bold text-ink hover:text-brand-500 transition-colors block truncate">
                            {ad.title}
                          </Link>
                          <p className="text-xs text-ink-secondary mt-1">
                            {timeAgo(ad.created_at)} · <span className="font-semibold text-brand-600">{formatPrice(ad.price, ad.currency)}</span>
                          </p>
                        </div>

                        <span className={`badge text-[10px] h-6 shrink-0 ${
                          ad.status === 'active'   ? 'bg-green-100 text-green-600' :
                          ad.status === 'reserved' ? 'bg-amber-100 text-amber-600' :
                          ad.status === 'rented'   ? 'bg-blue-100 text-blue-600' :
                          ad.status === 'sold'     ? 'bg-red-100 text-red-600' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {statusInfo.label}
                        </span>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                             onClick={() => handleToggleStatus(ad.id, ad.status, ad.category_id)}
                             title="Toggle Status"
                             className={`p-2 rounded-xl transition-colors ${
                               (ad.status === 'reserved' || ad.status === 'rented')
                                 ? 'text-brand-500 bg-brand-50' 
                                 : 'text-ink-tertiary hover:text-brand-500 hover:bg-surface-secondary'
                             }`}
                          >
                             <Lock className="w-4 h-4" />
                          </button>
                          <Link
                            href={`${AD_URL_PREFIX}/${ad.serial_number}`}
                            className="p-2 rounded-xl text-ink-tertiary hover:text-ink hover:bg-surface-secondary transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
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
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
}
