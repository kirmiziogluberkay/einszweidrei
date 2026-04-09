/**
 * app/admin/page.js
 * ─────────────────────────────────────────────────────
 * Admin dashboard — summary statistics.
 * ─────────────────────────────────────────────────────
 */

import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Megaphone, Users, MessageSquare, FolderTree } from 'lucide-react';

export const metadata = { title: 'Admin | Dashboard' };

/**
 * Statistics card component.
 */
function StatCard({ label, value, icon: Icon, href, color = 'blue' }) {
  const colors = {
    blue:  'bg-blue-50 text-blue-500',
    green: 'bg-green-50 text-green-500',
    amber: 'bg-amber-50 text-amber-500',
    brand: 'bg-brand-50 text-brand-500',
  };

  return (
    <Link href={href} className="card p-6 hover:shadow-lg transition-all block">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-ink-secondary mb-1">{label}</p>
          <p className="text-3xl font-bold text-ink">{value ?? '—'}</p>
        </div>
        <div className={`w-12 h-12 rounded-2xl ${colors[color]} flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </Link>
  );
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Parallel count queries
  const [
    { count: adsCount },
    { count: usersCount },
    { count: messagesCount },
    { count: categoriesCount },
  ] = await Promise.all([
    supabase.from('ads').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('messages').select('*', { count: 'exact', head: true }),
    supabase.from('categories').select('*', { count: 'exact', head: true }),
  ]);

  // Last 5 ads
  const { data: recentAds } = await supabase
    .from('ads')
    .select('id, serial_number, title, status, created_at, owner:profiles!owner_id(username)')
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-8">Overview</h1>

      {/* ── Statistics ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">
        <StatCard label="Total Ads"       value={adsCount}        icon={Megaphone}     href="/admin/ads"        color="brand" />
        <StatCard label="Total Users"     value={usersCount}      icon={Users}         href="/admin/users"      color="green" />
        <StatCard label="Inboxes"         value={messagesCount}   icon={MessageSquare} href="/admin/inbox"       color="amber" />
        <StatCard label="Categories"      value={categoriesCount} icon={FolderTree}    href="/admin/categories" color="blue"  />
      </div>

      {/* ── Recent ads ── */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-tertiary flex items-center justify-between">
          <h2 className="font-semibold text-ink">Recent Ads</h2>
          <Link href="/admin/ads" className="text-sm text-brand-500 hover:underline">See all</Link>
        </div>
        <div className="divide-y divide-surface-tertiary">
          {recentAds?.map((ad) => (
            <div key={ad.id} className="px-6 py-4 flex items-center justify-between text-sm">
              <div>
                <p className="font-medium text-ink">{ad.title}</p>
                <p className="text-xs text-ink-tertiary mt-0.5">
                  {ad.owner?.username} · #{ad.serial_number}
                </p>
              </div>
              <span className={`badge text-xs px-2 py-1 rounded-lg ${
                ad.status === 'active' ? 'bg-green-100 text-green-600' :
                ad.status === 'sold'   ? 'bg-red-100 text-red-600' :
                'bg-gray-100 text-gray-500'
              }`}>
                {ad.status === 'active' ? 'Active' : ad.status === 'sold' ? 'Sold' : 'Passive'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
