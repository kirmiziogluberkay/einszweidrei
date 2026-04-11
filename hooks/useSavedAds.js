'use client';

/**
 * hooks/useSavedAds.js
 * ─────────────────────────────────────────────────────
 * Kullanıcının kaydettiği ilanları yöneten hook.
 * ─────────────────────────────────────────────────────
 */

import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

/**
 * Kullanıcının kaydettiği ilan ID'lerini ve tam verilerini döner.
 * toggleSave ile ilan kaydedilir / kayıt kaldırılır (optimistik güncelleme).
 *
 * @param {string | null | undefined} userId
 */
export function useSavedAds(userId) {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();

  const idsKey  = ['saved_ads_ids',  userId];
  const listKey = ['saved_ads_list', userId];

  // ── Kaydedilen ilan ID'leri (SaveButton için hafif sorgu) ──
  const { data: savedIds = [], isLoading: idsLoading } = useQuery({
    queryKey: idsKey,
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('saved_ads')
        .select('ad_id')
        .eq('user_id', userId);
      if (error) throw new Error(error.message);
      return data.map(r => r.ad_id);
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });

  // ── Kaydedilen ilanların tam verisi (My Profile sayfası için) ──
  const { data: savedAds = [], isLoading: listLoading } = useQuery({
    queryKey: listKey,
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('saved_ads')
        .select(`
          ad_id,
          created_at,
          ad:ads(
            id, serial_number, title, description, price, currency,
            images, status, payment_methods, tags, address, created_at,
            category:categories(id, name, slug)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data.map(r => r.ad).filter(Boolean);
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });

  // ── Toggle: kaydet / kaydı kaldır ──
  const { mutate: toggleSave, isPending, error: toggleError } = useMutation({
    mutationFn: async (adId) => {
      const isSaved = savedIds.includes(adId);
      if (isSaved) {
        const { error } = await supabase
          .from('saved_ads')
          .delete()
          .eq('user_id', userId)
          .eq('ad_id', adId);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase
          .from('saved_ads')
          .insert({ user_id: userId, ad_id: adId });
        if (error) throw new Error(error.message);
      }
    },
    onMutate: async (adId) => {
      await queryClient.cancelQueries({ queryKey: idsKey });
      const prev = queryClient.getQueryData(idsKey);
      queryClient.setQueryData(idsKey, (old = []) =>
        old.includes(adId) ? old.filter(id => id !== adId) : [...old, adId]
      );
      return { prev };
    },
    onError: (_err, _adId, ctx) => {
      if (ctx?.prev !== undefined) queryClient.setQueryData(idsKey, ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: idsKey });
      queryClient.invalidateQueries({ queryKey: listKey });
    },
  });

  return {
    savedIds,
    savedAds,
    loading: idsLoading,
    listLoading,
    isSaved: (adId) => savedIds.includes(adId),
    toggleSave,
    isPending,
    toggleError,
  };
}
