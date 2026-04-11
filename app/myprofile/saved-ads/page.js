'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Bookmark } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSavedAds } from '@/hooks/useSavedAds';
import AdGrid from '@/components/ads/AdGrid';

export default function SavedAdsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { savedAds, listLoading } = useSavedAds(user?.id);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="container-app py-8">
      <h1 className="section-title flex items-center gap-2">
        <Bookmark className="w-6 h-6 text-brand-500" />
        Saved Ads
      </h1>
      <AdGrid
        ads={savedAds}
        loading={listLoading}
        emptyMessage="You haven't saved any ads yet."
        layout="grid"
      />
    </div>
  );
}
