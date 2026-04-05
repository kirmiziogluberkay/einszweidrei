/**
 * app/kategori/[slug]/page.js
 * ─────────────────────────────────────────────────────
 * Kategori sayfası — belirtilen slug'a göre ilanlar.
 * URL: /kategori/[slug]
 * ─────────────────────────────────────────────────────
 */

import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import KategoriClient from './KategoriClient';

/**
 * Dinamik SEO metadata.
 */
export async function generateMetadata({ params }) {
  const supabase = await createClient();
  const { data: category } = await supabase
    .from('categories')
    .select('name')
    .eq('slug', params.slug)
    .single();

  if (!category) return { title: 'Category Not Found' };
  return {
    title:       `${category.name} Ads`,
    description: `Second-hand and rental items in ${category.name} category.`,
  };
}

export default async function KategoriPage({ params }) {
  const supabase = await createClient();

  const { data: category } = await supabase
    .from('categories')
    .select('id, name, slug, parent:categories!parent_id(id, name, slug)')
    .eq('slug', params.slug)
    .single();

  if (!category) notFound();

  return <KategoriClient category={category} />;
}
