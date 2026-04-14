'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useSavedAds(userId) {
  const queryClient = useQueryClient();
  const idsKey  = ['saved_ads_ids',  userId];
  const listKey = ['saved_ads_list', userId];

  // Saved IDs (lightweight)
  const { data: savedIds = [], isLoading: idsLoading } = useQuery({
    queryKey: idsKey,
    queryFn:  async () => {
      const res  = await fetch('/api/saved-ads');
      const json = await res.json();
      return json.savedIds ?? [];
    },
    enabled:   !!userId,
    staleTime: 2 * 60 * 1000,
  });

  // Full saved ads list
  const { data: savedAds = [], isLoading: listLoading } = useQuery({
    queryKey: listKey,
    queryFn:  async () => {
      const res  = await fetch('/api/saved-ads?full=1');
      const json = await res.json();
      return json.savedAds ?? [];
    },
    enabled:   !!userId,
    staleTime: 2 * 60 * 1000,
  });

  // Toggle save / unsave with optimistic update
  const { mutate: toggleSave, isPending, error: toggleError } = useMutation({
    mutationFn: async (adId) => {
      const isSaved = savedIds.includes(adId);
      if (isSaved) {
        await fetch(`/api/saved-ads?adId=${adId}`, { method: 'DELETE' });
      } else {
        await fetch('/api/saved-ads', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ adId }),
        });
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
    loading:     idsLoading,
    listLoading,
    isSaved:     (adId) => savedIds.includes(adId),
    toggleSave,
    isPending,
    toggleError,
  };
}
