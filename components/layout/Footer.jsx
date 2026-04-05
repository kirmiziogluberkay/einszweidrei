/**
 * components/layout/Footer.jsx
 * ─────────────────────────────────────────────────────
 * Sayfa altı footer — sadece desktop'ta görünür.
 * ─────────────────────────────────────────────────────
 */

import Link from 'next/link';
import { SITE_NAME, SITE_DESCRIPTION } from '@/constants/config';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="hidden md:block bg-white border-t border-surface-tertiary mt-auto">
      <div className="container-app py-10">
        <div className="grid grid-cols-12 gap-8">

          {/* Marka açıklaması */}
          <div className="col-span-12 md:col-span-4">
            <Link href="/" className="font-bold text-lg text-ink">
              {SITE_NAME}
            </Link>
            <p className="mt-3 text-sm text-ink-secondary leading-relaxed max-w-xs">
              {SITE_DESCRIPTION}
            </p>
          </div>

          {/* Hızlı linkler */}
          <div className="col-span-6 md:col-span-2">
            <h4 className="text-xs font-semibold text-ink-tertiary uppercase tracking-widest mb-4">Platform</h4>
            <ul className="space-y-3">
              {[
                { label: 'Home',     href: '/'        },
                { label: 'Post Ad',  href: '/ilan-ver' },
                { label: 'Search',   href: '/ara'      },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-ink-secondary hover:text-ink transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Hesap linkleri */}
          <div className="col-span-6 md:col-span-2">
            <h4 className="text-xs font-semibold text-ink-tertiary uppercase tracking-widest mb-4">My Account</h4>
            <ul className="space-y-3">
              {[
                { label: 'Log In',     href: '/login'    },
                { label: 'Sign Up',    href: '/register' },
                { label: 'My Profile', href: '/myprofile' },
                { label: 'Messages',   href: '/mesajlar' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-ink-secondary hover:text-ink transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Alt çizgi */}
        <div className="border-t border-surface-tertiary mt-10 pt-6 flex flex-col sm:flex-row
                        items-center justify-between gap-3 text-xs text-ink-tertiary">
          <p>© {currentYear} {SITE_NAME}. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/gizlilik" className="hover:text-ink transition-colors">Privacy Policy</Link>
            <Link href="/kullanim" className="hover:text-ink transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
