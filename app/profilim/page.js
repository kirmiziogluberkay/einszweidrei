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
import { Loader2, Edit3, Trash2, Eye, Plus, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAds } from '@/hooks/useAds';
import { formatPrice, buildAdUrl, timeAgo } from '@/lib/helpers';
import { SUCCESS_MESSAGES, ERROR_MESSAGES, AD_STATUSES } from '@/constants/config';

/** @type {import('next').Metadata} */
export const metadata = { title: 'Profilim' };

export default function ProfilimPage() {
  const supabase          = createClient();
  const { user, profile, loading: authLoading } = useAuth();

  const { ads, loading: adsLoading, refetch } = useAds({
    ownerId: user?.id,
  });

  const [editMode,  setEditMode]  = useState(false);
  const [username,  setUsername]  = useState(profile?.username ?? '');
  const [phone,     setPhone]     = useState(profile?.phone ?? '');
  const [saving,    setSaving]    = useState(false);
  const [msg,       setMsg]       = useState(null);
  const [msgType,   setMsgType]   = useState('success');

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
    if (!confirm('Bu ilanı silmek istediğinize emin misiniz?')) return;

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

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="container-app py-8 max-w-3xl">
      <h1 className="section-title">Profilim</h1>

      {/* ── Mesaj ── */}
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

      {/* ── Profil bilgileri ── */}
      <div className="card p-6 mb-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-ink">Bilgilerim</h2>
          {!editMode && (
            <button
              onClick={() => {
                setUsername(profile?.username ?? '');
                setPhone(profile?.phone ?? '');
                setEditMode(true);
              }}
              className="btn-secondary py-2 text-sm"
            >
              <Edit3 className="w-4 h-4" /> Düzenle
            </button>
          )}
        </div>

        {editMode ? (
          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div>
              <label htmlFor="profile-username" className="label">Kullanıcı Adı</label>
              <input
                id="profile-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label htmlFor="profile-phone" className="label">Telefon</label>
              <input
                id="profile-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+90 5xx xxx xx xx"
                className="input"
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Kaydediliyor</> : 'Kaydet'}
              </button>
              <button type="button" onClick={() => setEditMode(false)} className="btn-secondary">İptal</button>
            </div>
          </form>
        ) : (
          <dl className="space-y-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-secondary">Kullanıcı Adı</dt>
              <dd className="font-medium text-ink">{profile?.username ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-secondary">E-posta</dt>
              <dd className="font-medium text-ink">{user?.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-secondary">Telefon</dt>
              <dd className="font-medium text-ink">{profile?.phone ?? '—'}</dd>
            </div>
          </dl>
        )}
      </div>

      {/* ── İlanlarım ── */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-ink">İlanlarım ({ads.length})</h2>
          <Link href="/ilan-ver" className="btn-primary">
            <Plus className="w-4 h-4" /> Yeni İlan
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
            Henüz ilan vermediniz.
          </div>
        ) : (
          <div className="space-y-3">
            {ads.map((ad) => {
              const statusInfo = AD_STATUSES[ad.status] ?? AD_STATUSES.active;
              return (
                <div key={ad.id} className="card p-4 flex items-center gap-4">
                  {/* Küçük fotoğraf */}
                  <div className="w-14 h-14 rounded-xl bg-surface-secondary flex-shrink-0 overflow-hidden">
                    {ad.images?.[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={ad.images[0]} alt={ad.title} className="w-full h-full object-cover" />
                    )}
                  </div>

                  {/* Bilgiler */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-ink text-sm truncate">{ad.title}</p>
                    <p className="text-xs text-ink-tertiary mt-0.5">
                      {timeAgo(ad.created_at)} · {formatPrice(ad.price, ad.currency)}
                    </p>
                  </div>

                  {/* Durum */}
                  <span className={`badge text-xs ${
                    ad.status === 'active'  ? 'bg-green-100 text-green-600' :
                    ad.status === 'sold'    ? 'bg-red-100 text-red-600' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {statusInfo.label}
                  </span>

                  {/* Eylemler */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Link
                      href={buildAdUrl(ad.serial_number)}
                      className="p-2 rounded-xl text-ink-tertiary hover:text-ink hover:bg-surface-secondary transition-colors"
                      aria-label="İlanı görüntüle"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/ilan/${ad.serial_number}/duzenle`}
                      className="p-2 rounded-xl text-ink-tertiary hover:text-ink hover:bg-surface-secondary transition-colors"
                      aria-label="İlanı düzenle"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDeleteAd(ad.id)}
                      aria-label="İlanı sil"
                      className="p-2 rounded-xl text-ink-tertiary hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
