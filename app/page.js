/**
 * app/page.js — Server Component
 * Prefetches initial ads + categories via GitHub DB.
 */

import { QueryClient, HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { readData }         from '@/lib/github-db';
import { buildCategoryTree } from '@/lib/helpers';
import { ADS_PER_PAGE }     from '@/constants/config';
import { Suspense }         from 'react';
import HomeContent          from './HomeContent';

export const revalidate = 60;

export const metadata = {
  title:       'EinsZweiDrei — Second-Hand & Rental Items',
  description: 'Second-hand buy-sell and rental items platform. Safe, easy, and fast.',
};

export default async function HomePage() {
  const queryClient = new QueryClient();

  // ── Prefetch categories ───────────────────────────────
  await queryClient.prefetchQuery({
    queryKey: ['categories'],
    queryFn:  async () => {
      const { data } = await readData('categories');
      const categories = (data ?? []).filter(c => c.is_active !== false);
      categories.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      return { categories, categoryTree: buildCategoryTree(categories) };
    },
    staleTime: 10 * 60 * 1000,
  });

  // ── Prefetch first page of ads ────────────────────────
  const defaultAdsKey = ['ads', null, undefined, undefined, '', null, null, 'Cash,PayPal,Free'];

  await queryClient.prefetchInfiniteQuery({
    queryKey:         defaultAdsKey,
    initialPageParam: 1,
    staleTime:        5 * 60 * 1000,
    queryFn: async ({ pageParam = 1 }) => {
      const [{ data: ads }, { data: categories }] = await Promise.all([
        readData('ads'),
        readData('categories'),
      ]);

      const active = ads.filter(a => a.status === 'active');
      active.sort((a, b) => {
        const aImg = a.images?.length > 0;
        const bImg = b.images?.length > 0;
        if (aImg && !bImg) return -1;
        if (!aImg && bImg) return  1;
        return new Date(b.created_at) - new Date(a.created_at);
      });

      const from  = (pageParam - 1) * ADS_PER_PAGE;
      const slice = active.slice(from, from + ADS_PER_PAGE);

      const withCats = slice.map(ad => {
        const cat = categories.find(c => c.id === ad.category_id);
        return cat ? { ...ad, category: { id: cat.id, name: cat.name, slug: cat.slug } } : ad;
      });

      return { ads: withCats, total: active.length, page: pageParam };
    },
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={null}>
        <HomeContent />
      </Suspense>
    </HydrationBoundary>
  );
}
