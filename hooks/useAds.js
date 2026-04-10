// force-rebuild-v2
'use client';

/**
 * hooks/useAds.js
 * ─────────────────────────────────────────────────────
 * Custom React hook managing ad listing, filtering,
 * and pagination logic.
 * ─────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ADS_PER_PAGE } from '@/constants/config';

/**
 * Hook that returns the list of ads.
 */
export function useAds(filters = {}) {
  const supabase = useMemo(() => createClient(), []);

  const { skip, categoryId, categoryIds, ownerId, owner_id, searchQuery, minPrice, maxPrice, paymentMethods, page = 1 } = filters;

  const [ads, setAds] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAds = useCallback(async () => {
    if (skip) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    const finalOwnerId = ownerId || owner_id;

    let query = supabase
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
        payment_methods,
        tags,
        category_id,
        created_at,
        category:categories(id, name, slug)
      `, { count: 'exact' });

    // Status filter - Public visitors see 'active', 'reserved', and 'rented' ads.
    if (!finalOwnerId) {
      query = query.in('status', ['active', 'reserved', 'rented']);
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

    const from = (page - 1) * ADS_PER_PAGE;
    const to = from + ADS_PER_PAGE - 1;
    query = query.range(from, to);

    const { data, error: fetchError, count } = await query;

    if (fetchError) {
      console.error('Supabase fetch error:', fetchError);
      setError(fetchError.message);
      setAds([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    const resultData = data || [];
    const sortedData = [...resultData].sort((a, b) => {
      const aHasImg = a.images && a.images.length > 0;
      const bHasImg = b.images && b.images.length > 0;
      if (aHasImg && !bHasImg) return -1;
      if (!aHasImg && bHasImg) return 1;
      return new Date(b.created_at) - new Date(a.created_at);
    });

    setAds(sortedData);
    setTotal(count ?? 0);
    setLoading(false);
  }, [supabase, skip, categoryId, categoryIds?.join(','), ownerId, owner_id, searchQuery, minPrice, maxPrice, paymentMethods?.join(','), page]);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  return {
    ads,
    total,
    /** Total number of pages */
    totalPages: Math.ceil(total / ADS_PER_PAGE),
    loading,
    error,
    refetch: fetchAds,
  };
}
