// force-rebuild-v1
// update 22:08
// status: global visibility for reserved/rented enabled
// feature: owner filter consolidated (supports owner_id and ownerId)
// feature: public ads show active/reserved/rented (excludes sold)
// logic: owner dashboard shows EVERYTHING including sold/passive if ownerId is passed
'use client';

/**
 * hooks/useAds.js
 * ─────────────────────────────────────────────────────
 * Custom React hook managing ad listing, filtering,
 * and pagination logic.
 * ─────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ADS_PER_PAGE } from '@/constants/config';

/**
 * Hook that returns the list of ads.
 *
 * @param {{
 *   categoryId?: string,
 *   ownerId?: string,
 *   searchQuery?: string,
 *   page?: number
 * }} [filters]
 *
 * @returns {{
 *   ads: Array,
 *   total: number,
 *   loading: boolean,
 *   error: string | null,
 *   refetch: () => void
 * }}
 */
export function useAds(filters = {}) {
  const supabase = createClient();

  const { skip, categoryId, categoryIds, ownerId, owner_id, searchQuery, maxPrice, paymentMethods, page = 1 } = filters;

  const [ads, setAds] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetches ads from Supabase.
   */
  const fetchAds = useCallback(async () => {
    if (skip) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    // Base query — join corresponding profile and category
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
        category_id,
        owner_id,
        created_at,
        owner:profiles(id, username),
        category:categories(id, name, slug)
      `, { count: 'exact' });

    // Status filter - Public visitors only see 'active' ads.
    // Ad owner (if ownerId is present) sees all statuses in their profile.
    const finalOwnerId = ownerId || owner_id;
    if (!finalOwnerId) {
      // General visitors ONLY see 'active' ones
      query = query.eq('status', 'active');
    } else {
      // Ad owner sees everything in their panel (including sold)
      query = query.in('status', ['active', 'reserved', 'rented', 'passive', 'sold']);
    }

    query = query.order('created_at', { ascending: false });

    // Category filter — single id or multiple id list supported
    if (categoryIds && categoryIds.length > 0) {
      // Multiple categories: filter with "in" operator
      query = query.in('category_id', categoryIds);
    } else if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    // Ad owner filter (their own ads on profile page)
    if (finalOwnerId) {
      query = query.eq('owner_id', finalOwnerId);
    }

    // Text search (within title and description)
    if (searchQuery) {
      query = query.or(
        `title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`
      );
    }

    // Price filter (upper limit and free/NULL ads)
    if (maxPrice !== undefined && maxPrice !== null) {
      query = query.or(`price.lte.${maxPrice},price.is.null`);
    }

    // Payment method filter
    if (paymentMethods) {
      if (paymentMethods.length > 0) {
        const hasFree = paymentMethods.includes('Free');
        const actualMethods = paymentMethods.filter(m => m !== 'Free');

        if (hasFree && actualMethods.length > 0) {
          // Both specific methods AND 'Free' are selected
          query = query.or(`payment_methods.ov.{${actualMethods.join(',')}},payment_methods.is.null,payment_methods.eq.{},price.eq.0,price.is.null`);
        } else if (hasFree) {
          // ONLY 'Free' is selected
          query = query.or('payment_methods.is.null,payment_methods.eq.{}' + (',price.eq.0,price.is.null'));
        } else {
          // ONLY specific methods are selected
          query = query.overlaps('payment_methods', actualMethods);
        }
      } else {
        // NONE of the methods are selected -> returns zero results
        query = query.eq('id', '00000000-0000-0000-0000-000000000000');
      }
    }

    // Pagination
    const from = (page - 1) * ADS_PER_PAGE;
    const to = from + ADS_PER_PAGE - 1;
    query = query.range(from, to);

    const { data, error: fetchError, count } = await query;

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    // Sort ads with images to the front, then by date (newest first)
    const sortedData = (data ?? []).sort((a, b) => {
      const aHasImg = a.images && a.images.length > 0;
      const bHasImg = b.images && b.images.length > 0;
      
      if (aHasImg && !bHasImg) return -1;
      if (!aHasImg && bHasImg) return 1;
      
      // If both have or don't have images, sort by date
      return new Date(b.created_at) - new Date(a.created_at);
    });

    setAds(sortedData);
    setTotal(count ?? 0);
    setLoading(false);
  }, [supabase, categoryId, categoryIds?.join(','), ownerId, owner_id, searchQuery, maxPrice, paymentMethods?.join(','), page]);

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
