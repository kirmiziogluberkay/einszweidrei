/**
 * app/category/[slug]/page.js
 * Category page — listings based on slug.
 */

import { notFound }  from 'next/navigation';
import { readData }  from '@/lib/github-db';
import CategoryClient from './CategoryClient';

export const revalidate = 0;

export async function generateMetadata({ params }) {
  const { data: categories } = await readData('categories');
  const category = (categories ?? []).find(c => c.slug === params.slug);
  if (!category) return { title: 'Category Not Found' };
  return {
    title:       `${category.name} Ads`,
    description: `Second-hand and rental items in ${category.name} category.`,
  };
}

export default async function CategoryPage({ params }) {
  const { data: allCats } = await readData('categories');

  const activeCats = (allCats ?? []).filter(c => c.is_active !== false);
  const category   = activeCats.find(c => c.slug === params.slug);

  if (!category) notFound();

  const sortBySortOrder = (a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999);
  const sorted = [...activeCats].sort(sortBySortOrder);

  let parent = sorted.find(c => c.id === category.parent_id) ?? null;

  // Fallback: keyword-based parent resolution
  if (!parent && category.parent_id) {
    const catName = category.name.toLowerCase();
    const secondHandKeywords = ['furniture', 'electronics', 'clothing', 'baby', 'sports', 'home', 'books'];
    const rentalKeywords     = ['rental', 'apartments', 'car', 'tools'];
    if (secondHandKeywords.some(k => catName.includes(k))) {
      parent = sorted.find(c => c.name.toLowerCase().includes('second hand')) ?? null;
    } else if (rentalKeywords.some(k => catName.includes(k))) {
      parent = sorted.find(c => c.name.toLowerCase().includes('rental')) ?? null;
    }
  }

  const children = sorted.filter(c => c.parent_id === category.id);

  const enrichedCategory = { ...category, parent: parent ?? null, children };

  const roots = sorted
    .filter(c => !c.parent_id)
    .map(root => ({
      ...root,
      children: sorted.filter(c => c.parent_id === root.id).sort(sortBySortOrder),
    }));

  return <CategoryClient category={enrichedCategory} categoryTree={roots} />;
}
