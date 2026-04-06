/**
 * components/layout/MobileNav.jsx
 * ─────────────────────────────────────────────────────
 * Mobilde ekranın altında görünen tab bar navigasyonu.
 * Phase 2: Restoring Labels & Routes
 * ─────────────────────────────────────────────────────
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Plus, MessageSquare, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';

const NAV_ITEMS = [
  { label: 'Home', href: '/', icon: Home, authRequired: false },
  { label: 'Search', href: '/ara', icon: Search, authRequired: false },
  { label: 'Post Ad', href: '/ilan-ver', icon: Plus, authRequired: true, featured: true },
  { label: 'Inbox', href: '/inbox', icon: MessageSquare, authRequired: true },
  { label: 'Profile', href: '/profilim', icon: User, authRequired: false },
];

export default function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { unreadCount = 0 } = useNotifications() || {};

  if (pathname.startsWith('/admin')) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/80 backdrop-blur-xl border-t border-surface-tertiary">
      <div className="flex items-center justify-around h-16">
        {NAV_ITEMS.map((item) => {
          if (item.authRequired && !user) return null;
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center gap-1 min-w-[64px] ${active ? 'text-brand-500' : 'text-ink-tertiary'}`}
            >
              {item.featured ? (
                 <div className="w-12 h-12 rounded-2xl bg-brand-500 flex items-center justify-center text-white shadow-lg -mt-8 border-4 border-white active:scale-90 transition-transform">
                     <Plus className="w-8 h-8" strokeWidth={3} />
                 </div>
              ) : (
                 <div className="relative flex flex-col items-center">
                   <Icon className={`w-6 h-6 transition-transform ${active ? 'scale-110' : ''}`} />
                   <span className="text-[10px] font-black uppercase tracking-tighter mt-1">{item.label}</span>
                   
                   {/* Unread badge placeholder */}
                   {item.label === 'Inbox' && unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white
                                      flex items-center justify-center text-[9px] font-bold rounded-full
                                      ring-2 ring-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                   )}
                 </div>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
