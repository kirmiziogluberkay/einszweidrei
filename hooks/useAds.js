'use client';

import { useCallback, useMemo } from 'react';
import { useInfiniteQuery }     from '@tanstack/react-query';
import { ADS_PER_PAGE }         from '@/constants/config';

export function useAds(filters = {}) {
  const {
    skip, categoryId, categoryIds, ownerId, owner_id,
    searchQuery, minPrice, maxPrice, paymentMethods,
  } = filters;

  const finalOwnerId = ownerId || owner_id;

  const queryKey = useMemo(() => [
    'ads',
    categoryId,
    categoryIds?.join(','),
    finalOwnerId,
    searchQuery,
    minPrice,
    maxPrice,
    paymentMethods?.join(','),
  ], [categoryId, categoryIds, finalOwnerId, searchQuery, minPrice, maxPrice, paymentMethods]);

  const fetchAds = useCallback(async ({ pageParam = 1 }) => {
    const params = new URLSearchParams();
    params.set('page',  String(pageParam));
    params.set('limit', String(ADS_PER_PAGE));

    if (finalOwnerId)                          params.set('owner_id',       finalOwnerId);
    if (categoryIds && categoryIds.length > 0) params.set('categoryIds',    categoryIds.join(','));
    else if (categoryId)                       params.set('categoryId',     categoryId);
    if (searchQuery)                           params.set('q',              searchQuery);
    if (minPrice !== null && minPrice !== undefined) params.set('minPrice', String(minPrice));
    if (maxPrice !== null && maxPrice !== undefined) params.set('maxPrice', String(maxPrice));
    if (paymentMethods && paymentMethods.length > 0) params.set('paymentMethods', paymentMethods.join(','));

    const res  = await fetch(`/api/ads?${params.toString()}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? 'Failed to fetch ads');

    return { ads: json.ads, total: json.total, page: pageParam };
  }, [finalOwnerId, categoryId, categoryIds, searchQuery, minPrice, maxPrice, paymentMethods]);

  const {
    data, isPending, error, refetch,
    fetchNextPage, hasNextPage, isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey,
    queryFn:          fetchAds,
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((s, p) => s + p.ads.length, 0);
      return loaded < lastPage.total ? allPages.length + 1 : undefined;
    },
    enabled:          !skip,
    staleTime:        5 * 60 * 1000,
    gcTime:           10 * 60 * 1000,
    placeholderData:  (prev) => prev,
    refetchOnMount:   'always',
    refetchOnWindowFocus: false,
  });

  const ads   = useMemo(() => data?.pages.flatMap(p => p.ads) ?? [], [data]);
  const total = data?.pages[0]?.total ?? 0;

  return {
    ads,
    total,
    totalPages: Math.ceil(total / ADS_PER_PAGE),
    loading:    isPending,
    error:      error?.message || null,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
}
