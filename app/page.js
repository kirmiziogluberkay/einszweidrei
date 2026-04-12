/**
 * app/page.js  — Server Component
 * ─────────────────────────────────────────────────────
 * Fetches initial ads + categories on the server, injects
 * them into the React Query cache via HydrationBoundary.
 * The client shell (HomeContent) hydrates instantly with
 * no loading spinner on first visit.
 * ─────────────────────────────────────────────────────
 */

import { QueryClient, HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/server';
import { buildCategoryTree } from '@/lib/helpers';
import { ADS_PER_PAGE } from '@/constants/config';
import { Suspense } from 'react';
import HomeContent from './HomeContent';

// Cache the rendered page for 60 seconds (ISR) — new ads appear within 1 minute
export const revalidate = 60;

export const metadata = {
  title:       'EinsZweiDrei — Second-Hand & Rental Items',
  description: 'Second-hand buy-sell and rental items platform. Safe, easy, and fast.',
};

export default async function HomePage() {
  const supabase    = await createClient();
  const queryClient = new QueryClient();

  // ── Prefetch categories ───────────────────────────────
  await queryClient.prefetchQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await supabase
        .from('categories')
        .select('id, name, slug, parent_id, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('name',       { ascending: true });
      const categories = data ?? [];
      return { categories, categoryTree: buildCategoryTree(categories) };
    },
    staleTime: 10 * 60 * 1000,
  });

  // ── Prefetch first page of ads (default filters) ──────
  // Query key must match exactly what useAds produces with:
  //   { categoryId: null, categoryIds: undefined, ownerId: undefined,
  //     owner_id: undefined, searchQuery: '', minPrice: null,
  //     maxPrice: null, paymentMethods: ['Cash','PayPal','Free'] }
  const defaultAdsKey = ['ads', null, undefined, undefined, '', null, null, 'Cash,PayPal,Free'];

  await queryClient.prefetchInfiniteQuery({
    queryKey:        defaultAdsKey,
    initialPageParam: 1,
    staleTime:       5 * 60 * 1000,
    queryFn: async ({ pageParam = 1 }) => {
      const from = (pageParam - 1) * ADS_PER_PAGE;
      const to   = from + ADS_PER_PAGE - 1;

      const { data, count } = await supabase
        .from('ads')
        .select(`
          id, serial_number, title, description, price, original_price,
          currency, images, status, payment_methods, address,
          category_id, created_at,
          category:categories(id, name, slug)
        `, { count: 'exact' })
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .range(from, to);

      const resultData = data ?? [];
      const sorted = [...resultData].sort((a, b) => {
        const aImg = a.images?.length > 0;
        const bImg = b.images?.length > 0;
        if (aImg && !bImg) return -1;
        if (!aImg && bImg) return  1;
        return new Date(b.created_at) - new Date(a.created_at);
      });

      return { ads: sorted, total: count ?? 0, page: pageParam };
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
