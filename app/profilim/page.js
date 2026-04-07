// update 21:05
// update 20:39
// update 17:10
// update 17:07
/**
 * app/profilim/page.js
 * ─────────────────────────────────────────────────────
 * Kullanıcı profil sayfası.
 * - Profil bilgileri düzenleme
 * - Kullanıcının kendi ilanları
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


export default function ProfilimPage() {
  const supabase = createClient();
  const { user, profile, loading: authLoading } = useAuth();

  const { ads, loading: adsLoading, refetch } = useAds({
    owner_id: user?.id,
  });
  const { categories } = useCategories();

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

  const [editMode, setEditMode] = useState(false);
  const [username, setUsername] = useState(profile?.username ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [msgType, setMsgType] = useState('success');

  /**
   * Profil bilgilerini kaydeder.
   * @param {React.FormEvent} e
   */
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    const { error } = await supabase
      .from('profiles')
      .update({ username: username.trim(), phone: phone.trim() })
      .eq('id', user.id);

    if (error) {
      setMsg(ERROR_MESSAGES.generic);
      setMsgType('error');
    } else {
      setMsg(SUCCESS_MESSAGES.profileSaved);
      setMsgType('success');
      setEditMode(false);
    }

    setSaving(false);
  };

  /**
   * İlanı siler.
   * @param {string} adId
   */
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
    }
  };

  /**
   * İlanın durumunu (active/reserved/rented) değiştirir.
   * Alt kategoriler de olsa root kategorisine (Second Hand/Rental) bakar.
   * @param {string} adId
   * @param {string} currentStatus
   * @param {string} categoryId
   */
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
      console.error('Status update failed:', error.message);
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
      <h1 className="section-title">My Profile</h1>

      {/* ── Mesaj ── */}
      {msg && (
        <div className={`flex items-start gap-2 p-4 rounded-2xl text-sm mb-6 ${msgType === 'success'
          ? 'bg-green-50 border border-green-100 text-green-600'
          : 'bg-red-50 border border-red-100 text-red-600'
          }`}>
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {/* ── Profil bilgileri ── */}
      <div className="card p-6 mb-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-ink">My Information</h2>
          {!editMode && (
            <button
              onClick={() => {
                setUsername(profile?.username ?? '');
                setPhone(profile?.phone ?? '');
                setEditMode(true);
              }}
              className="btn-secondary py-2 text-sm"
            >
              <Edit3 className="w-4 h-4" /> Edit
            </button>
          )}
        </div>

        {editMode ? (
          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div>
              <label htmlFor="profile-username" className="label">Username</label>
              <input
                id="profile-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label htmlFor="profile-phone" className="label">Phone</label>
              <input
                id="profile-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+xx xxx xxx xx xx"
                className="input"
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving</> : 'Save'}
              </button>
              <button type="button" onClick={() => setEditMode(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        ) : (
          <dl className="space-y-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-secondary">Username</dt>
              <dd className="font-medium text-ink">{profile?.username ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-secondary">Email</dt>
              <dd className="font-medium text-ink">{user?.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-secondary">Phone</dt>
              <dd className="font-medium text-ink">{profile?.phone ?? '—'}</dd>
            </div>
          </dl>
        )}
      </div>

      {/* ── İlanlarım ── */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-ink">My Ads ({ads.length})</h2>
          <Link href="/post-ad" className="btn-primary">
            <Plus className="w-4 h-4" /> New Ad
          </Link>
        </div>

        {adsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-20 rounded-2xl" />
            ))}
          </div>
        ) : ads.length === 0 ? (
          <div className="card p-10 text-center text-ink-secondary text-sm">
            You haven't posted any ads yet.
          </div>
        ) : (
          <div className="space-y-10">
            {/* ── Helpers to render grouped list ── */}
            {[
              { title: 'Second Hand Items', list: secondHandAds },
              { title: 'Rental Items', list: rentalAds },
              { title: 'Other Listings', list: otherAds }
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
                        <div key={ad.id} className="card p-4 flex items-center gap-4">
                          {/* İnce Fotoğraf */}
                          <div className="w-14 h-14 rounded-xl bg-surface-secondary flex-shrink-0 overflow-hidden">
                            {ad.images?.[0] && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={ad.images[0]} alt={ad.title} className="w-full h-full object-cover" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-ink text-sm truncate">{ad.title}</p>
                            <p className="text-xs text-ink-tertiary mt-0.5">
                              {timeAgo(ad.created_at)} · {formatPrice(ad.price, ad.currency)}
                            </p>
                          </div>

                          {/* Durum Badge */}
                          <span className={`badge text-[10px] shrink-0 ${ad.status === 'active' ? 'bg-green-100 text-green-600' :
                            ad.status === 'reserved' ? 'bg-amber-100 text-amber-600' :
                              ad.status === 'rented' ? 'bg-blue-100 text-blue-600' :
                                ad.status === 'sold' ? 'bg-red-100 text-red-600' :
                                  'bg-gray-100 text-gray-500'
                            }`}>
                            {statusInfo?.label || ad.status}
                          </span>

                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => handleToggleStatus(ad.id, ad.status, ad.category_id)}
                              aria-label="Toggle Status"
                              title="Toggle Reserved/Rented"
                              className={`p-2 rounded-xl transition-colors ${(ad.status === 'reserved' || ad.status === 'rented')
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
                              className="p-2 rounded-xl text-ink-tertiary hover:text-ink hover:bg-surface-secondary transition-colors"
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
    </div>
  );
}
