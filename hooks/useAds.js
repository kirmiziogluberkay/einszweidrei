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
 * İlan listeleme, filtreleme ve sayfalama işlemlerini
 * yöneten custom React hook.
 * ─────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ADS_PER_PAGE } from '@/constants/config';

/**
 * İlan listesini döndüren hook.
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

  const { categoryId, categoryIds, ownerId, owner_id, searchQuery, maxPrice, page = 1 } = filters;

  const [ads, setAds] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * İlanları Supabase'den çeker.
   */
  const fetchAds = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Temel sorgu — ilgili profilini ve kategoriyi birleştir
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

    // Durum filtresi - Genel ziyaretçiler sadece 'active' ilanları görür.
    // İlan sahibi (ownerId varsa) kendi profilinde tüm durumları görür.
    const finalOwnerId = ownerId || owner_id;
    if (!finalOwnerId) {
      // Genel ziyaretçiler SADECE 'active' olanları görür
      query = query.eq('status', 'active');
    } else {
      // İlan sahibi kendi panelinde her şeyi görür (satılanlar dahil)
      query = query.in('status', ['active', 'reserved', 'rented', 'passive', 'sold']);
    }

    query = query.order('created_at', { ascending: false });

    // Kategori filtresi — tek id veya çoklu id listesi desteklenir
    if (categoryIds && categoryIds.length > 0) {
      // Birden fazla kategori: "in" operatörü ile filtrele
      query = query.in('category_id', categoryIds);
    } else if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    // İlan sahibi filtresi (profil sayfasında kendi ilanları)
    if (finalOwnerId) {
      query = query.eq('owner_id', finalOwnerId);
    }

    // Metin araması (başlık ve açıklama içinde)
    if (searchQuery) {
      query = query.or(
        `title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`
      );
    }

    // Fiyat filtresi (üst limit ve ücretsiz/NULL ilanlar)
    if (maxPrice !== undefined && maxPrice !== null) {
      query = query.or(`price.lte.${maxPrice},price.is.null`);
    }

    // Sayfalama
    const from = (page - 1) * ADS_PER_PAGE;
    const to = from + ADS_PER_PAGE - 1;
    query = query.range(from, to);

    const { data, error: fetchError, count } = await query;

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    // Sayfa içinde görselli ilanları öne, görselsizleri arkaya al, kendi içlerinde tarihe göre sırala
    const sortedData = (data ?? []).sort((a, b) => {
      const aHasImg = a.images && a.images.length > 0;
      const bHasImg = b.images && b.images.length > 0;
      
      if (aHasImg && !bHasImg) return -1;
      if (!aHasImg && bHasImg) return 1;
      
      // İkisi de görselli ya da görselsiz ise tarihe göre (yeni en üstte)
      return new Date(b.created_at) - new Date(a.created_at);
    });

    setAds(sortedData);
    setTotal(count ?? 0);
    setLoading(false);
  }, [supabase, categoryId, categoryIds?.join(','), ownerId, owner_id, searchQuery, maxPrice, page]);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  return {
    ads,
    total,
    /** Toplam sayfa sayısı */
    totalPages: Math.ceil(total / ADS_PER_PAGE),
    loading,
    error,
    refetch: fetchAds,
  };
}
