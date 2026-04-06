/**
 * components/layout/MobileNav.jsx
 * ─────────────────────────────────────────────────────
 * Mobilde ekranın altında görünen tab bar navigasyonu.
 * ULTRA GÜVENLİ VERSİYON
 * ─────────────────────────────────────────────────────
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Plus, MessageSquare, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

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

  if (pathname.startsWith('/admin')) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-surface-tertiary">
      <div className="flex items-center justify-around h-16">
        {NAV_ITEMS.map((item) => {
          if (item.authRequired && !user) return null;
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 ${active ? 'text-brand-500' : 'text-ink-tertiary'}`}
            >
              {item.featured ? (
                 <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center text-white shadow-md">
                     <Icon className="w-6 h-6" />
                 </div>
              ) : (
                 <>
                   <Icon className="w-6 h-6" />
                   <span className="text-[10px] uppercase font-bold tracking-tighter">{item.label}</span>
                 </>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
