'use client';

/**
 * hooks/useCategories.js
 * ─────────────────────────────────────────────────────
 * Kategorileri Supabase'den çeken ve ağaç yapısına
 * dönüştüren custom React hook.
 * ─────────────────────────────────────────────────────
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { buildCategoryTree } from '@/lib/helpers';

/**
 * Tüm kategorileri düz liste ve ağaç yapısında döndürür.
 *
 * @returns {{
 *   categories: Array,
 *   categoryTree: Array,
 *   loading: boolean,
 *   error: string | null,
 *   refetch: () => void
 * }}
 */
export function useCategories() {
  const supabase = useMemo(() => createClient(), []);

  const fetchCategories = async () => {
    console.log('fetchCategories called');
    const { data, error: fetchError } = await supabase
      .from('categories')
      .select('id, name, slug, parent_id, sort_order')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (fetchError) {
      throw new Error(fetchError.message);
    }

    const categories = data ?? [];
    const categoryTree = buildCategoryTree(categories);

    return { categories, categoryTree };
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  return {
    categories: data?.categories || [],
    categoryTree: data?.categoryTree || [],
    loading: isLoading,
    error: error?.message || null,
    refetch: () => {}, // React Query handles refetch
  };
}
