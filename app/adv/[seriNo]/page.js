// force-rebuild-v1
/**
 * app/adv/[seriNo]/page.js
 * ─────────────────────────────────────────────────────
 * Ad detail page.
 * URL: /adv/[SERI-NO]
 * ─────────────────────────────────────────────────────
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import ShareButtons from '@/components/ads/ShareButtons';
import AdDetailClient from './AdDetailClient';
import ContactButton from './ContactButton';
import DeleteAdButton from './DeleteAdButton';
import StatusToggle from '@/components/ads/StatusToggle';
import SoldToggle from '@/components/ads/SoldToggle';
import { Pencil, CheckCircle2, MapPin } from 'lucide-react';
import { formatPrice, formatDate, formatUsername } from '@/lib/helpers';
import { AD_STATUSES } from '@/constants/config';

/** SEO metadata */
export async function generateMetadata({ params }) {
  const supabase = await createClient();

  const { data: ad } = await supabase
    .from('ads')
    .select('title, description, images')
    .eq('serial_number', params.seriNo)
    .single();

  if (!ad) return { title: 'Ad Not Found' };

  return {
    title: ad.title,
    description: ad.description?.slice(0, 155),
    openGraph: {
      title: ad.title,
      description: ad.description?.slice(0, 155),
      images: ad.images?.[0] ? [{ url: ad.images[0] }] : [],
    },
  };
}

export default async function AdDetailPage({ params }) {
  const supabase = await createClient();

  // Fetch the ad and its category details in one query
  const { data: ad } = await supabase
    .from('ads')
    .select(`
      id,
      serial_number,
      title,
      description,
      price,
      currency,
      area,
      images,
      status,
      payment_methods,
      tags,
      address,
      owner_id,
      category_id,
      created_at,
      updated_at,
      owner:profiles!owner_id(id, username, phone),
      category:categories(id, name, slug, parent_id)
    `)
    .eq('serial_number', params.seriNo)
    .single();

  if (!ad) notFound();

  // Check active session and permissions
  const { data: { user } } = await supabase.auth.getUser();
  let isAdmin = false;

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (profile?.role === 'admin') isAdmin = true;
  }

  const canEdit = user && (user.id === ad.owner?.id || isAdmin);

  // Fetch all categories to identify parent names manually
  const { data: allCats } = await supabase
    .from('categories')
    .select('id, name, slug, parent_id');

  // CORRECT HIERARCHY FIX: Breadcrumb structure: Home / [Parent] / [Sub] / [Title]
  const breadcrumbs = [];

  // Find current subcategory (e.g., Furniture)
  const currentCategory = allCats?.find(c => c.id === ad.category?.id);

  if (currentCategory) {
    // Check if it has a direct parent link in the DB
    let parent = allCats?.find(pc => pc.id === currentCategory.parent_id);

    // CORRECT HIERARCHY FIX: EMERGENCY OVERRIDE (Hardcore Fix)
    // If the database has no parent linked, we manually determine it based on keywords.
    if (!parent) {
      const catName = currentCategory.name.toLowerCase();

      // Keywords that typically belong to "Second Hand Items"
      const secondHandKeywords = ['furniture', 'electronics', 'clothing', 'baby', 'sports', 'home'];
      // Keywords that typically belong to "Rental Items"
      const rentalKeywords = ['rental', 'apartments', 'car', 'tools'];

      if (secondHandKeywords.some(key => catName.includes(key))) {
        parent = allCats?.find(c => c.name.toLowerCase().includes('second hand'));
      } else if (rentalKeywords.some(key => catName.includes(key))) {
        parent = allCats?.find(c => c.name.toLowerCase().includes('rental items'));
      }
    }

    // Add found parent to list
    if (parent) {
      breadcrumbs.push({ name: parent.name, slug: parent.slug });
    }

    // Add current subcategory to list
    breadcrumbs.push({ name: currentCategory.name, slug: currentCategory.slug });
  }

  const statusInfo = AD_STATUSES[ad.status] ?? AD_STATUSES.active;

  // Safe tag parsing (handles string or null values)
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

  const propertyFeatures = rawTags.filter(t => typeof t === 'string' && t.startsWith('FEATURE:')).map(t => t.split(':')[1]);
  
  const AVAILABLE_FEATURES = [
    { id: 'ANMELDUNG', label: 'Anmeldung Possible', icon: '📝' },
    { id: 'NO_ANMELDUNG', label: 'Anmeldung Not Possible', icon: '🚫' },
    { id: 'UNDERFLOOR_HEATING', label: 'Underfloor Heating', icon: '♨️' },
    { id: 'CENTRAL_HEATING', label: 'Central Heating', icon: '🌡️' },
    { id: 'ELEVATOR', label: 'Elevator / Lift', icon: '🛗' },
    { id: 'FIBER_INTERNET', label: 'High-Speed Fiber Internet', icon: '⚡' },
    { id: 'WHEELCHAIR_ACCESSIBLE', label: 'Wheelchair Accessible', icon: '♿' },
    { id: 'FITTED_KITCHEN', label: 'Fitted Kitchen', icon: '🍳' },
    { id: 'DISHWASHER', label: 'Dishwasher', icon: '🍽️' },
    { id: 'OVEN_STOVE', label: 'Oven & Stove', icon: '🍲' },
    { id: 'FRIDGE_FREEZER', label: 'Fridge & Freezer', icon: '🧊' },
    { id: 'MICROWAVE', label: 'Microwave', icon: '🍱' },
    { id: 'WASHING_MACHINE', label: 'In-unit Washing Machine', icon: '🌀' },
    { id: 'SHARED_LAUNDRY', label: 'Shared Laundry Room', icon: '👚' },
    { id: 'TUMBLE_DRYER', label: 'Tumble Dryer', icon: '🌬️' },
    { id: 'BATHTUB', label: 'Bathtub', icon: '🛁' },
    { id: 'WALKIN_SHOWER', label: 'Walk-in Shower', icon: '🚿' },
    { id: 'BALCONY', label: 'Balcony', icon: '☀️' },
    { id: 'TERRACE', label: 'Terrace / Deck', icon: '🪴' },
    { id: 'GARDEN', label: 'Private Garden', icon: '🌳' },
    { id: 'UNDERGROUND_PARKING', label: 'Underground Parking', icon: '🅿️' },
    { id: 'OUTDOOR_PARKING', label: 'Outdoor Parking Space', icon: '🚗' },
    { id: 'BICYCLE_STORAGE', label: 'Bicycle Storage', icon: '🚲' },
    { id: 'BASEMENT_STORAGE', label: 'Basement Storage Unit', icon: '📦' },
    { id: 'AIR_CONDITIONING', label: 'Air Conditioning', icon: '❄️' },
    { id: 'FURNISHED', label: 'Furnished', icon: '🛋️' },
    { id: 'SEMI_FURNISHED', label: 'Semi-furnished', icon: '🪑' },
    { id: 'UNFURNISHED', label: 'Unfurnished', icon: '🏠' },
    { id: 'NON_SMOKING', label: 'Non-smoking Household', icon: '🚭' },
    { id: 'PET_FRIENDLY', label: 'Pet Friendly', icon: '🐾' },
    { id: 'ENERGY_EFFICIENT', label: 'Energy Efficiency Rating', icon: '🌱' }
  ];

  return (
    <div className="container-app py-8">

      {/* Mobile breadcrumb (shown only on small screens) */}
      <nav className="flex md:hidden items-center gap-1.5 text-sm text-ink-tertiary mb-6" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink transition-colors">Home</Link>
        <span className="opacity-40">/</span>
        {breadcrumbs.map((bc, index) => (
          <span key={index} className="flex items-center gap-1.5">
            <Link href={`/category/${bc.slug}`} className="hover:text-ink transition-colors">{bc.name}</Link>
            <span className="opacity-40">/</span>
          </span>
        ))}
        <span className="text-ink font-medium truncate max-w-[200px]">{ad.title}</span>
      </nav>

      {/* Main layout: sidebar + content */}
      <div className="flex gap-4">

        {/* ── Left Sidebar: Tree Navigation ── */}
        <aside className="hidden md:block w-52 flex-shrink-0">
          <div className="sticky top-20 bg-white border border-surface-tertiary rounded-2xl p-4 shadow-sm">
            <ul className="space-y-0.5 text-sm">
              {/* Home */}
              <li>
                <Link href="/" className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-ink-secondary hover:text-ink hover:bg-surface-secondary transition-colors">
                  <span>🏠</span>
                  <span>Home</span>
                </Link>
              </li>
              {/* Breadcrumb segments (parent → sub categories) */}
              {breadcrumbs.map((bc, index) => (
                <li key={index} style={{ paddingLeft: `${(index + 1) * 16}px` }}>
                  <Link
                    href={`/category/${bc.slug}`}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-ink-secondary hover:text-ink hover:bg-surface-secondary transition-colors"
                  >
                    <span className="opacity-40 text-xs">└</span>
                    <span>{bc.name}</span>
                  </Link>
                </li>
              ))}
              {/* Current ad title (active, not clickable) */}
              <li style={{ paddingLeft: `${(breadcrumbs.length + 1) * 16}px` }}>
                <span className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-brand-50 text-brand-600 font-medium text-xs">
                  <span className="opacity-40">└</span>
                  <span className="truncate">{ad.title}</span>
                </span>
              </li>
            </ul>
          </div>
        </aside>

        {/* ── Right: Main Content ── */}
        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

            <div className="lg:col-span-3 space-y-6">
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
                             <div className="font-semibold text-sm text-ink">{roomType === '2' || roomType === '3' ? 'Private Bath' : 'Shared Bath'}</div>
                           </div>
                         </div>
                         <div className="bg-white border border-surface-tertiary rounded-2xl p-4 flex items-center gap-4">
                           <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-green-100 text-green-600">
                             ✅
                           </div>
                           <div>
                             <div className="font-semibold text-sm text-ink">{roomType === '3' ? 'Private Kitchen' : 'Shared Kitchen'}</div>
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

              {/* Fallback: show a notice if room details are missing */}
              {ad.category?.slug?.includes('room') && !hasRoomDetails && (
                <div className="card p-6 bg-orange-50 border-orange-100">
                   <h2 className="text-sm font-bold text-orange-700 mb-2">Notice for Visitors</h2>
                   <p className="text-xs text-orange-600">The homeowner hasn't updated the detailed room, flatmate and privacy preferences for this room yet.</p>
                </div>
              )}

              {/* Property Features (Universal for all Accommodations) */}
              {propertyFeatures.length > 0 && (
                <div className="card p-6 bg-brand-50/10 border-brand-100">
                   <h2 className="text-lg font-semibold text-ink mb-4 flex items-center gap-2">
                     <span>✨</span> Property Features
                   </h2>
                   <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {propertyFeatures.map(feat => {
                        const def = AVAILABLE_FEATURES.find(f => f.id === feat);
                        if (!def) return null;
                        return (
                          <div key={feat} className="flex flex-col items-center justify-center p-4 bg-white border border-brand-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow gap-2">
                            <span className="text-3xl">{def.icon}</span>
                            <span className="text-xs font-semibold text-ink text-center leading-tight">{def.label}</span>
                          </div>
                        );
                      })}
                   </div>
                </div>
              )}

              <div className="card p-6">
                <h2 className="text-lg font-semibold text-ink mb-4">Description</h2>
                <p className="text-ink-secondary text-sm leading-relaxed whitespace-pre-wrap">
                  {ad.description || 'Description not provided.'}
                </p>
              </div>


              <div className="card p-5">
                <ShareButtons title={ad.title} serialNumber={ad.serial_number} />
              </div>
            </div>

            <aside className="lg:col-span-2 space-y-4">
              <div className="card p-6">
                <h3 className="text-base font-semibold text-ink mb-4">Advertiser</h3>
                {user ? (
                  <>
                    <Link
                      href={`/profile/${ad.owner?.username}`}
                      className="flex items-center gap-3 mb-4 group cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600
                                      flex items-center justify-center font-bold text-sm
                                      group-hover:bg-brand-500 group-hover:text-white transition-all shadow-sm">
                        {formatUsername(ad.owner?.username).charAt(0) || "?"}
                      </div>
                      <div>
                        <p className="font-bold text-ink text-sm group-hover:text-brand-500 transition-colors">
                          {formatUsername(ad.owner?.username)}
                        </p>
                      </div>
                    </Link>
                    {user?.id !== ad.owner_id && (
                      <ContactButton
                        adId={ad.id}
                        adTitle={ad.title}
                        receiverId={ad.owner?.id}
                        receiverName={ad.owner?.username}
                      />
                    )}
                    {user?.id === ad.owner_id && (
                      <p className="text-[11px] font-bold text-brand-500 uppercase tracking-widest text-center py-2.5 border-2 border-brand-100 rounded-xl bg-brand-50/50">
                        YOUR ADVERTISEMENT
                      </p>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4 px-2 bg-surface-secondary rounded-xl border border-surface-tertiary">
                    <p className="text-sm text-ink-secondary mb-3 px-2">
                      Please log in to see seller information and send a message.
                    </p>
                    <Link
                      href="/login"
                      className="btn-primary w-full max-w-[200px] mx-auto text-sm py-2"
                    >
                      Log In
                    </Link>
                  </div>
                )}
              </div>

              <div className="card p-6 space-y-4">
                <div className="flex flex-col gap-0.5 mb-2">
                  <span className="text-[9px] font-bold text-ink-tertiary uppercase tracking-wider">Status</span>
                  <span className={`font-bold text-[11px] ${ad.status === 'active' ? 'text-green-600' :
                    ad.status === 'sold' ? 'text-red-500' :
                      ad.status === 'reserved' ? 'text-amber-500' :
                        ad.status === 'rented' ? 'text-blue-600' :
                          'text-ink-tertiary'
                    }`}>
                    {statusInfo.label}
                  </span>
                </div>

                <h1 className="text-[14px] font-bold text-ink leading-tight mb-4">{ad.title}</h1>

                {canEdit && (
                  <div className="flex items-center gap-1 mb-6">
                    <div className="w-28 flex-shrink-0">
                      <StatusToggle
                        adId={ad.id}
                        currentStatus={ad.status}
                        categoryId={ad.category_id}
                        categories={allCats}
                      />
                    </div>

                    {!breadcrumbs.some(bc => bc.name.toLowerCase().includes('rental')) && (
                      <div className="w-28 flex-shrink-0">
                        <SoldToggle adId={ad.id} currentStatus={ad.status} />
                      </div>
                    )}
                    <Link
                      href={`/adv/${ad.serial_number}/edit`}
                      className="btn-owner-action w-20 flex-shrink-0 bg-surface-secondary text-ink-secondary hover:text-brand-600 hover:bg-brand-50"
                      title="Edit Ad"
                    >
                      <Pencil className="w-4 h-4" />
                      Edit
                    </Link>
                    <div className="w-24 flex-shrink-0">
                      <DeleteAdButton adId={ad.id} />
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold text-ink-tertiary uppercase tracking-wider">
                    {ad.category?.slug?.startsWith('accommodation') ? 'Rent' : 'Price'}
                  </span>
                  {/* Free in green if no price given */}
                  {(!ad.price || ad.price === 0) ? (
                    <p className="text-3xl font-bold text-green-500">Free</p>
                  ) : (
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-bold text-brand-500">
                        {formatPrice(ad.price, ad.currency)}
                      </p>
                      {rentType && (
                        <span className="text-lg text-ink-secondary font-semibold">({rentType === 'WARM' ? 'Warm' : 'Cold'})</span>
                      )}
                    </div>
                  )}
                </div>

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
                      <dd className="text-ink font-medium">{ad.area} m²</dd>
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
                      {ad.payment_methods.map(method => {
                        const isPayPal = method?.toLowerCase() === 'paypal';
                        const isCash = method?.toLowerCase() === 'cash';
                        const label = isPayPal ? 'PayPal' : (isCash ? 'Cash' : method);

                        return (
                          <div key={method} className="flex items-center gap-2 px-3 py-2 bg-surface-secondary rounded-xl border border-surface-tertiary/50">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span className="text-sm font-medium text-ink-secondary">{label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {ad.address && (
                <div className="card p-6">
                  <div className="flex flex-col gap-3 mb-4">
                    <h2 className="text-lg font-semibold text-ink flex items-center gap-2">
                       <MapPin className="w-5 h-5 text-brand-500" />
                       Location
                    </h2>
                    <span className="text-sm text-ink-secondary bg-surface-secondary p-2.5 rounded-xl border border-surface-tertiary">{ad.address}</span>
                  </div>
                  
                  <div className="relative w-full h-[250px] rounded-2xl overflow-hidden bg-surface-secondary border border-surface-tertiary">
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      style={{ border: 0 }}
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(ad.address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                      allowFullScreen
                    ></iframe>
                    <div className="absolute inset-0 pointer-events-none border border-black/5 rounded-2xl" />
                  </div>
                  <p className="text-[10px] text-ink-tertiary mt-3 italic">
                    * Exact location might differ.
                  </p>
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
