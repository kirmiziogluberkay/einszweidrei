// update 17:10
/**
 * app/profile/[username]/page.js
 * ─────────────────────────────────────────────────────
 * Public Profile Page — Shows all active ads for a specific user.
 * ─────────────────────────────────────────────────────
 */

import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdGrid from '@/components/ads/AdGrid';
import { User, Calendar, MapPin, Tag } from 'lucide-react';
import { formatDate, formatUsername } from '@/lib/helpers';

export async function generateMetadata({ params }) {
  return {
    title: `${formatUsername(params.username)}'s Profile`,
  };
}

export default async function PublicProfilePage({ params }) {
  const supabase = await createClient();

  // 1. Fetch User Profile by username
  const { data: profile, error: profError } = await supabase
    .from('profiles')
    .select('id, username, created_at, role, avatar_url')
    .eq('username', params.username)
    .single();

  if (profError || !profile) notFound();

  // 2. Fetch active/reserved/rented ads for this user
  const { data: ads, count } = await supabase
    .from('ads')
    .select(`
      id, serial_number, title, description, price, currency, images, status, created_at,
      category:categories(id, name, slug)
    `, { count: 'exact' })
    .eq('owner_id', profile.id)
    .in('status', ['active', 'reserved', 'rented'])
    .order('created_at', { ascending: false });

  return (
    <div className="container-app py-8">
      {/* ── Header Section ── */}
      <div className="card p-8 mb-8 bg-white border-none shadow-sm overflow-hidden relative">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50" />
        
        <div className="relative flex flex-col md:flex-row items-center md:items-start gap-8">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-brand-100 ring-4 ring-white shadow-md flex items-center justify-center
                          text-brand-600 text-3xl font-bold flex-shrink-0">
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
                   <span>{count || 0} active ads</span>
                 </div>
                 {profile.role === 'admin' && (
                    <span className="bg-brand-100 text-brand-600 text-[10px] uppercase font-bold px-2 py-0.5 rounded-md tracking-wider">
                      Staff Member
                    </span>
                 )}
              </div>
            </div>
            
            <p className="text-sm text-ink-tertiary max-w-2xl">
               Welcome to {formatUsername(profile.username)}'s shop. Here you can find all the items they are currently selling on {process.env.NEXT_PUBLIC_SITE_NAME || 'Einszweidrei'}.
            </p>
          </div>
        </div>
      </div>

      {/* ── Ads Section ── */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-surface-tertiary pb-4">
           <h2 className="text-xl font-bold text-ink">Advertisements</h2>
        </div>

        <AdGrid 
          ads={ads || []} 
          loading={false} 
          layout="grid" 
          emptyMessage="This user currently has no active ads." 
        />
      </div>
    </div>
  );
}
