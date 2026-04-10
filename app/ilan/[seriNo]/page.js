// update 17:19
// update 17:02
// update 16:42
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
    twitter: {
      card: 'summary_large_image',
      title: ad.title,
      description: ad.description?.slice(0, 155),
      images: ad.images?.[0] ? [ad.images[0]] : [],
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
      area,
      payment_methods,
      tags,
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

  // Güvenli tag ayrıştırma (Eğer tags string geldiyse veya null ise korur)
  let rawTags = [];
  if (Array.isArray(ad.tags)) {
    rawTags = ad.tags;
  } else if (typeof ad.tags === 'string') {
    try {
       rawTags = JSON.parse(ad.tags);
    } catch(e) {
       rawTags = ad.tags.replace(/^{|}$/g, '').split(',').map(s => s.trim().replace(/^"|"$/g, ''));
    }
  }

  const roomTags = rawTags.filter(t => typeof t === 'string' && t.startsWith('ROOM_'));
  const getTag = (prefix) => {
     const t = roomTags.find(tag => tag.startsWith(prefix));
     return t ? t.split(':')[1] : null;
  }

  const roomType = getTag('ROOM_TYPE') || '1';
  const totalRooms = parseInt(getTag('ROOM_TOTAL') || '2', 10);
  const residentFemale = parseInt(getTag('ROOM_FEMALE') || '0', 10);
  const residentMale = parseInt(getTag('ROOM_MALE') || '0', 10);
  const preferredGender = getTag('ROOM_TARGET') || 'ANY';
  const hasRoomDetails = roomTags.length > 0;
  
  const sharedCount = residentFemale + residentMale;

  const rentTypeTag = rawTags.find(t => typeof t === 'string' && t.startsWith('RENT_TYPE:'));
  const rentType = rentTypeTag ? rentTypeTag.split(':')[1] : null;

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

          {/* Room Details Block */}
          {hasRoomDetails && (
            <div className="card p-0 overflow-hidden bg-brand-50/20 border-brand-100">
               <div className="bg-brand-500 text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                 <h2 className="text-xl font-bold flex items-center gap-2">
                   🏡 Smart Room-Listing
                 </h2>
                 <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase border border-white/30 backdrop-blur-sm self-start sm:self-auto">
                   Single Occupancy
                 </span>
               </div>
               
               <div className="p-6 space-y-6">
                 {/* Hierarchy 1: Privacy Type */}
                 <div>
                   <h3 className="text-xs uppercase font-bold text-ink-tertiary mb-3 tracking-wider">Features & Access</h3>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                     <div className="bg-white border border-surface-tertiary rounded-2xl p-4 flex items-center gap-4">
                       <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-green-100 text-green-600">
                         ✅
                       </div>
                       <div>
                         <div className="font-semibold text-sm text-ink">{roomType === '2' || roomType === '3' ? 'Private Bath (En-suite)' : 'Shared Bathroom'}</div>
                         <div className="text-xs text-ink-secondary">Bathroom access</div>
                       </div>
                     </div>
                     <div className="bg-white border border-surface-tertiary rounded-2xl p-4 flex items-center gap-4">
                       <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-green-100 text-green-600">
                         ✅
                       </div>
                       <div>
                         <div className="font-semibold text-sm text-ink">{roomType === '3' ? 'Private Kitchen' : 'Shared Kitchen'}</div>
                         <div className="text-xs text-ink-secondary">Kitchen access</div>
                       </div>
                     </div>
                   </div>
                 </div>

                 {/* Hierarchy 2/3: Apartment & Flatmates */}
                 <div>
                   <h3 className="text-xs uppercase font-bold text-ink-tertiary mb-3 tracking-wider">Apartment & Flatmates</h3>
                   <div className="bg-white border border-surface-tertiary rounded-2xl p-5">
                      <div className="text-base text-ink mb-4 font-medium flex items-center gap-2">
                        <span className="text-xl">🚪</span>
                        This room is part of a <strong>{totalRooms}-room</strong> apartment.
                      </div>
                      
                      <div className="border-t border-surface-tertiary pt-4 mt-2">
                        <p className="text-sm text-ink-secondary mb-3">
                           {sharedCount > 0 
                             ? <span>You will be sharing the apartment with <strong>{sharedCount}</strong> other people:</span> 
                             : "You will be the only person living in the other rooms."
                           }
                        </p>
                        {sharedCount > 0 && (
                          <div className="flex flex-wrap items-center gap-3">
                            {residentFemale > 0 && Array.from({length: residentFemale}).map((_, i) => (
                              <div key={`f-${i}`} className="flex items-center gap-1.5 bg-pink-50 text-pink-700 px-3 py-1.5 rounded-xl border border-pink-100 font-semibold text-sm shadow-sm">
                                🚶‍♀️ Female
                              </div>
                            ))}
                            {residentMale > 0 && Array.from({length: residentMale}).map((_, i) => (
                              <div key={`m-${i}`} className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl border border-blue-100 font-semibold text-sm shadow-sm">
                                🚶‍♂️ Male
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="border-t border-surface-tertiary pt-4 mt-4">
                        <p className="text-sm text-ink-secondary mb-2">Target Tenant Preference:</p>
                        <div className="flex items-center gap-2">
                           {preferredGender === 'ANY' && <span className="bg-brand-50 text-brand-700 px-3 py-1.5 rounded-lg text-sm font-semibold border border-brand-100">Any Gender</span>}
                           {preferredGender === 'FEMALE' && <span className="bg-pink-50 text-pink-700 px-3 py-1.5 rounded-lg text-sm font-semibold border border-pink-100">Female Only</span>}
                           {preferredGender === 'MALE' && <span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-semibold border border-blue-100">Male Only</span>}
                        </div>
                      </div>
                   </div>
                 </div>
               </div>
            </div>
          )}

          {/* Fallback Information: Eger oda detaylari hala gozukmuyorsa diye bir uyari goster */}
          {ad.category?.slug?.includes('room') && !hasRoomDetails && (
            <div className="card p-6 bg-orange-50 border-orange-100">
               <h2 className="text-sm font-bold text-orange-700 mb-2">Notice for Visitors</h2>
               <p className="text-xs text-orange-600">The homeowner hasn't updated the detailed room, flatmate and privacy preferences for this room yet.</p>
            </div>
          )}

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
                ad.status === 'sold'     ? 'bg-red-100 text-red-600' :
                ad.status === 'reserved' ? 'bg-amber-100 text-amber-600' :
                ad.status === 'rented'   ? 'bg-blue-100 text-blue-600' :
                'bg-gray-100 text-gray-600'
              }`}>
                {statusInfo.label}
              </span>
            )}

            {/* Başlık */}
            <h1 className="text-2xl font-bold text-ink leading-tight">{ad.title}</h1>

            {/* Fiyat */}
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-brand-500">
                {formatPrice(ad.price, ad.currency)}
              </p>
              {rentType && (
                <span className="text-lg text-ink-secondary font-semibold">({rentType === 'WARM' ? 'Warm' : 'Cold'})</span>
              )}
            </div>

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
              {ad.area && (
                <div className="flex justify-between">
                  <dt className="text-ink-secondary">Area</dt>
                  <dd className="text-ink">{ad.area} m²</dd>
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
