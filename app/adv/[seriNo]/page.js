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
import { formatPrice, formatDate } from '@/lib/helpers';
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
    title:       ad.title,
    description: ad.description?.slice(0, 155),
    openGraph: {
      title:  ad.title,
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
      images,
      status,
      created_at,
      updated_at,
      owner:profiles!owner_id(id, username, phone),
      category:categories(id, name, slug, parent_id)
    `)
    .eq('serial_number', params.seriNo)
    .single();

  if (!ad) notFound();

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

  return (
    <div className="container-app py-8">

      {/* CORRECT HIERARCHY FIX: Navigation - FIXED to always show Second Hand / Rental labels */}
      <nav className="flex items-center gap-1.5 text-sm text-ink-tertiary mb-6" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink transition-colors">Home</Link>
        <span className="opacity-40">/</span>
        
        {breadcrumbs.map((bc, index) => (
          <span key={index} className="flex items-center gap-1.5">
            <Link href={`/category/${bc.slug}`} className="hover:text-ink transition-colors">
              {bc.name}
            </Link>
            <span className="opacity-40">/</span>
          </span>
        ))}
        
        <span className="text-ink font-medium truncate max-w-[200px]">{ad.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <AdDetailClient images={ad.images} title={ad.title} />

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
          <div className="card p-6 space-y-4">
            {ad.status !== 'active' && (
              <span className={`badge ${
                ad.status === 'sold' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
              }`}>
                {statusInfo.label}
              </span>
            )}
            {/* Fiyat - Free in green if no price given */}
            {(!ad.price || ad.price === 0) ? (
              <p className="text-3xl font-bold text-green-500">Free</p>
            ) : (
              <p className="text-3xl font-bold text-brand-500">
                {formatPrice(ad.price, ad.currency)}
              </p>
            )}

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
          </div>

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
