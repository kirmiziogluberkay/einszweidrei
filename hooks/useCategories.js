'use client';

/**
 * hooks/useCategories.js
 * ─────────────────────────────────────────────────────
 * Kategorileri Supabase'den çeken ve ağaç yapısına
 * dönüştüren custom React hook.
 * ─────────────────────────────────────────────────────
 */

import { useState, useEffect } from 'react';
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
  const supabase = createClient();

  /** Veritabanından gelen düz kategori listesi */
  const [categories, setCategories] = useState([]);

  /** Ağaç yapısına dönüştürülmüş kategoriler */
  const [categoryTree, setCategoryTree] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Kategorileri Supabase'den çeker.
   */
  const fetchCategories = async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('categories')
      .select('id, name, slug, parent_id, sort_order')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    setCategories(data ?? []);
    setCategoryTree(buildCategoryTree(data ?? []));
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    categories,
    categoryTree,
    loading,
    error,
    /** Kategorileri yeniden yükle */
    refetch: fetchCategories,
  };
}
