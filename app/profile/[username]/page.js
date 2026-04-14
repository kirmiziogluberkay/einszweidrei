/**
 * app/profile/[username]/page.js
 * Public Profile Page — Shows all active ads for a specific user.
 */

import { notFound }  from 'next/navigation';
import { readData }  from '@/lib/github-db';
import AdGrid        from '@/components/ads/AdGrid';
import { Calendar, Tag } from 'lucide-react';
import { formatDate, formatUsername } from '@/lib/helpers';

export async function generateMetadata({ params }) {
  return {
    title: `${formatUsername(params.username)}'s Profile`,
  };
}

export default async function PublicProfilePage({ params }) {
  const { data: profiles } = await readData('profiles');

  const profile = (profiles ?? []).find(
    p => p.username?.toLowerCase() === params.username?.toLowerCase()
  );

  if (!profile) notFound();

  const { data: allAds }        = await readData('ads');
  const { data: allCategories } = await readData('categories');

  const userAds = (allAds ?? [])
    .filter(a => a.owner_id === profile.id && ['active', 'reserved', 'rented'].includes(a.status))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .map(ad => {
      const cat = (allCategories ?? []).find(c => c.id === ad.category_id);
      return cat ? { ...ad, category: { id: cat.id, name: cat.name, slug: cat.slug } } : ad;
    });

  return (
    <div className="container-app py-8">
      {/* Header */}
      <div className="card p-8 mb-8 bg-white border-none shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50" />

        <div className="relative flex flex-col md:flex-row items-center md:items-start gap-8">
          <div className="w-24 h-24 rounded-full bg-brand-100 ring-4 ring-white shadow-md flex items-center justify-center text-brand-600 text-3xl font-bold flex-shrink-0">
            {formatUsername(profile.username).charAt(0)}
          </div>

          <div className="flex-1 text-center md:text-left space-y-4">
            <div>
              <h1 className="text-3xl font-extrabold text-ink">{formatUsername(profile.username)}</h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-2 text-ink-secondary">
                <div className="flex items-center gap-1.5 text-sm">
                  <Calendar className="w-4 h-4 text-brand-500" />
                  <span>Joined {formatDate(profile.created_at)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                  <Tag className="w-4 h-4 text-brand-500" />
                  <span>{userAds.length} active ads</span>
                </div>
                {profile.role === 'admin' && (
                  <span className="bg-brand-100 text-brand-600 text-[10px] uppercase font-bold px-2 py-0.5 rounded-md tracking-wider">
                    Staff Member
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ads */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-surface-tertiary pb-4">
          <h2 className="text-xl font-bold text-ink">Advertisements</h2>
        </div>
        <AdGrid
          ads={userAds}
          loading={false}
          layout="grid"
          emptyMessage="This user currently has no active ads."
        />
      </div>
    </div>
  );
}
