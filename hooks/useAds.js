// force-rebuild-v3
'use client';

/**
 * hooks/useAds.js
 * ─────────────────────────────────────────────────────
 * Custom React hook managing ad listing, filtering,
 * and infinite scroll pagination logic.
 * ─────────────────────────────────────────────────────
 */

import { useCallback, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { ADS_PER_PAGE } from '@/constants/config';

/**
 * Hook that returns the list of ads with infinite scroll support.
 */
export function useAds(filters = {}) {
  const supabase = useMemo(() => createClient(), []);

  const { skip, categoryId, categoryIds, ownerId, owner_id, searchQuery, minPrice, maxPrice, paymentMethods } = filters;

  const queryKey = useMemo(() => [
    'ads',
    skip,
    categoryId,
    categoryIds?.join(','),
    ownerId || owner_id,
    searchQuery,
    minPrice,
    maxPrice,
    paymentMethods?.join(','),
  ], [skip, categoryId, categoryIds, ownerId, owner_id, searchQuery, minPrice, maxPrice, paymentMethods]);

  const fetchAds = useCallback(async ({ pageParam = 1 }) => {
    if (skip) {
      return { ads: [], total: 0, page: pageParam };
    }

    const finalOwnerId = ownerId || owner_id;

    let query = supabase
      .from('ads')
      .select(`
        id,
        serial_number,
        title,
        description,
        price,
        original_price,
        currency,
        images,
        status,
        payment_methods,
        tags,
        address,
        category_id,
        created_at,
        category:categories(id, name, slug)
      `, { count: 'exact' });

    if (!finalOwnerId) {
      query = query.in('status', ['active', 'rented']);
    } else {
      query = query.eq('owner_id', finalOwnerId);
    }

    query = query.order('created_at', { ascending: false });

    if (categoryIds && categoryIds.length > 0) {
      query = query.in('category_id', categoryIds);
    } else if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
    }

    if (minPrice || maxPrice) {
      if (minPrice !== null && minPrice !== undefined) query = query.gte('price', minPrice);
      if (maxPrice !== null && maxPrice !== undefined) query = query.lte('price', maxPrice);
    }

    if (paymentMethods && paymentMethods.length > 0 && paymentMethods.length < 3) {
      const hasFree = paymentMethods.includes('Free');
      const otherMethods = paymentMethods.filter(m => m !== 'Free');

      if (hasFree && otherMethods.length === 0) {
        query = query.or('price.is.null,price.eq.0');
      } else if (!hasFree && otherMethods.length > 0) {
        query = query.overlaps('payment_methods', otherMethods);
      } else if (hasFree && otherMethods.length > 0) {
        const otherMethodsList = otherMethods.join(',');
        query = query.or(`price.is.null,price.eq.0,payment_methods.ov.{${otherMethodsList}}`);
      }
    }

    const from = (pageParam - 1) * ADS_PER_PAGE;
    const to = from + ADS_PER_PAGE - 1;
    query = query.range(from, to);

    const { data, error: fetchError, count } = await query;

    if (fetchError) {
      throw new Error(fetchError.message);
    }

    const resultData = data || [];
    const sortedData = [...resultData].sort((a, b) => {
      const aHasImg = a.images && a.images.length > 0;
      const bHasImg = b.images && b.images.length > 0;
      if (aHasImg && !bHasImg) return -1;
      if (!aHasImg && bHasImg) return 1;
      return new Date(b.created_at) - new Date(a.created_at);
    });

    return { ads: sortedData, total: count ?? 0, page: pageParam };
  }, [supabase, skip, categoryId, categoryIds, ownerId, owner_id, searchQuery, minPrice, maxPrice, paymentMethods]);

  const {
    data,
    isPending,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey,
    queryFn: fetchAds,
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const totalLoaded = allPages.reduce((sum, p) => sum + p.ads.length, 0);
      if (totalLoaded < lastPage.total) return allPages.length + 1;
      return undefined;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (prev) => prev,
    refetchOnMount: 'always',
  });

  const ads = useMemo(() => data?.pages.flatMap(p => p.ads) ?? [], [data]);
  const total = data?.pages[0]?.total ?? 0;

  return {
    ads,
    total,
    totalPages: Math.ceil(total / ADS_PER_PAGE),
    loading: isPending,
    error: error?.message || null,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
}
