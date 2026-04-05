/**
 * components/layout/MobileNav.jsx
 * ─────────────────────────────────────────────────────
 * Mobilde ekranın altında görünen tab bar navigasyonu.
 * iOS uygulamalarındaki tab bar'dan ilham alınmıştır.
 * Sadece mobilde görünür (md: ve üstünde gizlenir).
 * ─────────────────────────────────────────────────────
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Plus, MessageSquare, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/helpers';

/**
 * Navigasyon öğesi tanımları.
 * `authRequired: true` olan öğeler sadece giriş yapıldığında gösterilir.
 */
const NAV_ITEMS = [
  {
    label:        'Anasayfa',
    href:         '/',
    icon:         Home,
    authRequired: false,
    exact:        true,
  },
  {
    label:        'Ara',
    href:         '/ara',
    icon:         Search,
    authRequired: false,
    exact:        false,
  },
  {
    label:        'İlan Ver',
    href:         '/ilan-ver',
    icon:         Plus,
    authRequired: true,
    exact:        false,
    /** İlan ver butonu için özel orta vurgulu stil */
    featured:     true,
  },
  {
    label:        'Mesajlar',
    href:         '/mesajlar',
    icon:         MessageSquare,
    authRequired: true,
    exact:        false,
  },
  {
    label:        'Profil',
    href:         user => user ? '/profilim' : '/login',
    icon:         User,
    authRequired: false,
    exact:        false,
  },
];

export default function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  // Admin sayfasında gösterme
  if (pathname.startsWith('/admin')) return null;

  /**
   * Bir nav öğesinin aktif olup olmadığını kontrol eder.
   *
   * @param {string} href
   * @param {boolean} exact
   * @returns {boolean}
   */
  const isActive = (href, exact) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden
                 glass border-t border-surface-tertiary pb-safe"
      aria-label="Alt navigasyon"
    >
      <div className="flex items-center justify-around h-14 px-2">
        {NAV_ITEMS.map((item) => {
          // Auth gerektiren ve giriş yapılmamış öğeleri gizle
          if (item.authRequired && !user) return null;

          // Href fonksiyon da olabilir (Profil için)
          const href = typeof item.href === 'function' ? item.href(user) : item.href;
          const active = isActive(href, item.exact);
          const Icon = item.icon;

          if (item.featured) {
            // Merkezi "+" butonu — özel tasarım
            return (
              <Link
                key={item.href}
                href={href}
                aria-label={item.label}
                className="flex flex-col items-center justify-center
                           w-12 h-12 rounded-2xl bg-brand-500 text-white
                           shadow-[0_4px_15px_rgba(14,165,233,0.4)]
                           hover:bg-brand-600 active:scale-95 transition-all"
              >
                <Icon className="w-6 h-6" strokeWidth={2.5} />
              </Link>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center justify-center gap-1 min-w-[52px] py-1',
                'rounded-xl transition-colors',
                active ? 'text-brand-500' : 'text-ink-tertiary'
              )}
            >
              <Icon className="w-6 h-6" strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
