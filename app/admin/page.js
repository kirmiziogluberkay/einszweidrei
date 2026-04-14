/**
 * app/admin/page.js — Admin dashboard (server component)
 */

import Link from 'next/link';
import { readData } from '@/lib/github-db';
import { Megaphone, Users, MessageSquare, FolderTree } from 'lucide-react';

export const metadata = { title: 'Admin | Dashboard' };

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
  const [
    { data: ads },
    { data: profiles },
    { data: messages },
    { data: categories },
  ] = await Promise.all([
    readData('ads'),
    readData('profiles'),
    readData('messages'),
    readData('categories'),
  ]);

  const recentAds = (ads ?? [])
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5)
    .map(ad => {
      const owner = (profiles ?? []).find(p => p.id === ad.owner_id);
      return { ...ad, ownerUsername: owner?.username ?? '—' };
    });

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-8">Overview</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">
        <StatCard label="Total Ads"    value={(ads ?? []).length}        icon={Megaphone}     href="/admin/ads"        color="brand" />
        <StatCard label="Total Users"  value={(profiles ?? []).length}   icon={Users}         href="/admin/users"      color="green" />
        <StatCard label="Inboxes"      value={(messages ?? []).length}   icon={MessageSquare} href="/admin/inbox"      color="amber" />
        <StatCard label="Categories"   value={(categories ?? []).length} icon={FolderTree}    href="/admin/categories" color="blue"  />
      </div>

      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-tertiary flex items-center justify-between">
          <h2 className="font-semibold text-ink">Recent Ads</h2>
          <Link href="/admin/ads" className="text-sm text-brand-500 hover:underline">See all</Link>
        </div>
        <div className="divide-y divide-surface-tertiary">
          {recentAds.map((ad) => (
            <div key={ad.id} className="px-6 py-4 flex items-center justify-between text-sm">
              <div>
                <p className="font-medium text-ink">{ad.title}</p>
                <p className="text-xs text-ink-tertiary mt-0.5">
                  {ad.ownerUsername} · #{ad.serial_number}
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
