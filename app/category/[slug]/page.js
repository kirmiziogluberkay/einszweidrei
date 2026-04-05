/**
 * app/category/[slug]/page.js
 * ─────────────────────────────────────────────────────
 * Category page — listings based on slug.
 * URL: /category/[slug]
 * ─────────────────────────────────────────────────────
 */

import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import KategoriClient from './KategoriClient';

/** Dynamic SEO metadata */
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

export default async function CategoryPage({ params }) {
  const supabase = await createClient();

  // Fetch the requested category
  const { data: category } = await supabase
    .from('categories')
    .select('id, name, slug, parent_id')
    .eq('slug', params.slug)
    .single();

  if (!category) notFound();

  // Fetch ALL categories to build the hierarchy manually if parent_id is missing
  const { data: allCats } = await supabase
    .from('categories')
    .select('id, name, slug, parent_id');

  // Build parent chain: walk up parent_id links
  let parent = allCats?.find(c => c.id === category.parent_id) ?? null;

  // EMERGENCY OVERRIDE: If no parent found via DB, use keyword matching.
  // This works around the case where parent_id is null in the database.
  if (!parent) {
    const catName = category.name.toLowerCase();
    const secondHandKeywords = ['furniture', 'electronics', 'clothing', 'baby', 'sports', 'home', 'books'];
    const rentalKeywords = ['rental', 'apartments', 'car', 'tools'];

    if (secondHandKeywords.some(key => catName.includes(key))) {
      parent = allCats?.find(c => c.name.toLowerCase().includes('second hand')) ?? null;
    } else if (rentalKeywords.some(key => catName.includes(key))) {
      parent = allCats?.find(c => c.name.toLowerCase().includes('rental')) ?? null;
    }
  }

  // Build the enriched category object with resolved parent
  const enrichedCategory = {
    ...category,
    parent: parent ?? null,
  };

  return <KategoriClient category={enrichedCategory} />;
}
