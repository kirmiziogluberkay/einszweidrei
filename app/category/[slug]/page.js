/**
 * app/category/[slug]/page.js
 * ─────────────────────────────────────────────────────
 * Category page — listings based on slug.
 * URL: /category/[slug]
 * ─────────────────────────────────────────────────────
 */

import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import CategoryClient from './CategoryClient';

export const revalidate = 0; // Force dynamic rendering for newest categories

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

  // Fetch ALL categories to:
  // 1. Resolve the parent category (for breadcrumb)
  // 2. Find all children (for showing subcategory ads)
  const { data: allCats } = await supabase
    .from('categories')
    .select('id, name, slug, parent_id, sort_order')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  // Resolve parent via DB
  let parent = allCats?.find(c => c.id === category.parent_id) ?? null;

  // EMERGENCY OVERRIDE: If no parent in DB, resolve via keyword matching
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

  // Find direct children of this category (subcategories)
  // Used so that parent categories show ads from ALL their subcategories
  const children = allCats?.filter(c => c.parent_id === category.id) ?? [];

  // Build the enriched category object
  const enrichedCategory = {
    ...category,
    parent: parent ?? null,
    children,
  };

  // Build the full category tree for sidebar navigation
  // roots = top-level categories; each has children attached
  const sortBySortOrder = (a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999);

  const roots = allCats
    ?.filter(c => !c.parent_id)
    .sort(sortBySortOrder)
    .map(root => ({
      ...root,
      children: allCats
        .filter(c => c.parent_id === root.id)
        .sort(sortBySortOrder),
    })) ?? [];

  return <CategoryClient category={enrichedCategory} categoryTree={roots} />;
}
