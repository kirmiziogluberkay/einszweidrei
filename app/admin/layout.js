'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Megaphone, FolderTree, MessageSquare, ArrowLeft, Users, Lightbulb, Settings, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

/** Admin sidebar links */
const ADMIN_NAV = [
  { label: 'Overview',           href: '/admin',            icon: LayoutDashboard   },
  { label: 'Ads Management',     href: '/admin/ads',        icon: Megaphone         },
  { label: 'Category Management',href: '/admin/categories', icon: FolderTree        },
  { label: 'User Management',    href: '/admin/users',      icon: Users             },
  { label: 'Feedbacks',          href: '/admin/feedback',   icon: Lightbulb         },
  { label: 'Site Settings',      href: '/admin/settings',   icon: Settings          },
];

export default function AdminLayout({ children }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Sadece her şey kesinleştiğinde (loading:false ve profile çekilmişken) karar ver
    if (!loading && user) {
      if (profile && profile.role !== 'admin') {
        router.replace('/');
      }
    } else if (!loading && !user) {
      router.replace('/');
    }
  }, [user, profile, loading, router]);

  if (loading || (user && !profile)) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-56px)] bg-surface-secondary">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!user || profile?.role !== 'admin') {
    return null;
  }
  return (
    <div className="flex min-h-[calc(100vh-56px)]">

      {/* ── Sidebar ── */}
      <aside className="hidden md:flex flex-col w-64 bg-ink text-white flex-shrink-0">
        <div className="p-5 border-b border-white/10">
          <p className="font-bold text-sm uppercase tracking-widest text-white/60">Admin Panel</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {ADMIN_NAV.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/70
                         hover:text-white hover:bg-white/10 transition-colors"
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-white/50 hover:text-white/80 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Site
          </Link>
        </div>
      </aside>

      {/* ── Content ── */}
      <main className="flex-1 bg-surface-secondary p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
}
