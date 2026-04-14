'use client';

import { useQuery }    from '@tanstack/react-query';
import { buildCategoryTree } from '@/lib/helpers';

export function useCategories() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res  = await fetch('/api/categories');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to fetch categories');
      const categories  = json.categories ?? [];
      const categoryTree = buildCategoryTree(categories);
      return { categories, categoryTree };
    },
    staleTime: 10 * 60 * 1000,
    gcTime:    30 * 60 * 1000,
  });

  return {
    categories:  data?.categories  ?? [],
    categoryTree: data?.categoryTree ?? [],
    loading:     isLoading,
    error:       error?.message || null,
    refetch,
  };
}
