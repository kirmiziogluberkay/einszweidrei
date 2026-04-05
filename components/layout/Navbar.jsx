/**
 * components/layout/Navbar.jsx
 * ─────────────────────────────────────────────────────
 * Üst navigasyon çubuğu.
 * - Dinamik kategori menüsü (Supabase'den çekilir)
 * - Oturum durumuna göre değişen linkler
 * - Sticky & blur efektli Apple tarzı tasarım
 * ─────────────────────────────────────────────────────
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Plus, User, Menu, X, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCategories } from '@/hooks/useCategories';
import { SITE_NAME, AUTH_NAV_LINKS } from '@/constants/config';
import { cn } from '@/lib/helpers';

export default function Navbar() {
  const pathname = usePathname();
  const { user, profile, isAdmin, signOut } = useAuth();
  const { categoryTree } = useCategories();

  /** Mobil menünün açık/kapalı durumu */
  const [mobileOpen, setMobileOpen] = useState(false);

  /** Aktif dropdown menü (kategori id'si) */
  const [openDropdown, setOpenDropdown] = useState(null);

  /** Scroll sonrası navbar arka planı için flag */
  const [scrolled, setScrolled] = useState(false);

  // Sayfa değişince menüyü kapat
  useEffect(() => {
    setMobileOpen(false);
    setOpenDropdown(null);
  }, [pathname]);

  // Scroll dinleyici — navbar blur efekti için
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-all duration-300',
        scrolled
          ? 'glass border-b border-surface-tertiary shadow-[var(--shadow-sm)]'
          : 'bg-white border-b border-surface-tertiary'
      )}
    >
      <nav className="container-app">
        <div className="flex items-center justify-between h-14">

          {/* ── Logo ── */}
          <Link
            href="/"
            className="font-bold text-xl text-ink tracking-tight hover:text-brand-500 transition-colors"
            aria-label="Go to homepage"
          >
            {SITE_NAME}
          </Link>

          {/* ── Orta: Kategori Menüsü (Desktop) ── */}
          <div className="hidden md:flex items-center gap-1">
            {categoryTree.map((cat) => (
              <div key={cat.id} className="relative">
                <button
                  onMouseEnter={() => setOpenDropdown(cat.id)}
                  onMouseLeave={() => setOpenDropdown(null)}
                  onClick={() => setOpenDropdown(
                    openDropdown === cat.id ? null : cat.id
                  )}
                  className={cn(
                    'flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    openDropdown === cat.id
                      ? 'bg-surface-secondary text-brand-500'
                      : 'text-ink-secondary hover:text-ink hover:bg-surface-secondary'
                  )}
                  aria-expanded={openDropdown === cat.id}
                  aria-haspopup="menu"
                >
                  {cat.name}
                  {cat.children?.length > 0 && (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </button>

                {/* Dropdown */}
                {cat.children?.length > 0 && openDropdown === cat.id && (
                  <div
                    role="menu"
                    onMouseEnter={() => setOpenDropdown(cat.id)}
                    onMouseLeave={() => setOpenDropdown(null)}
                    className="absolute top-full left-0 mt-1 w-52 bg-white rounded-2xl shadow-[var(--shadow-xl)]
                               border border-surface-tertiary py-2 animate-fade-in"
                  >
                    <Link
                      href={`/category/${cat.slug}`}
                      className="block px-4 py-2 text-sm text-ink-secondary hover:text-ink
                                 hover:bg-surface-secondary transition-colors font-medium"
                    >
                      All — {cat.name}
                    </Link>
                    <div className="border-t border-surface-tertiary my-1" />
                    {cat.children.map((sub) => (
                      <Link
                        key={sub.id}
                        href={`/category/${sub.slug}`}
                        role="menuitem"
                        className="block px-4 py-2 text-sm text-ink-secondary
                                   hover:text-ink hover:bg-surface-secondary transition-colors"
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ── Sağ: Eylemler ── */}
          <div className="flex items-center gap-2">

            {/* Arama */}
            <Link
              href="/ara"
              className="p-2 rounded-xl text-ink-secondary hover:text-ink hover:bg-surface-secondary transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </Link>

            {user ? (
              <>
                {/* İlan Ver */}
                <Link href="/post-ad" className="btn-primary hidden sm:inline-flex">
                  <Plus className="w-4 h-4" />
                  Post Ad
                </Link>

                {/* Admin butonu */}
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="p-2 rounded-xl text-brand-500 hover:bg-brand-50 transition-colors"
                    aria-label="Admin panel"
                    title="Admin Panel"
                  >
                    <ShieldCheck className="w-5 h-5" />
                  </Link>
                )}

                {/* Profil dropdown */}
                <div className="relative group">
                  <button
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-surface-secondary transition-colors"
                    aria-label="Profil menüsü"
                  >
                    <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600
                                    flex items-center justify-center text-xs font-bold">
                      {profile?.username?.charAt(0).toUpperCase() ?? <User className="w-4 h-4" />}
                    </div>
                  </button>

                  {/* Profil dropdown menüsü */}
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl
                                  shadow-[var(--shadow-xl)] border border-surface-tertiary py-2
                                  invisible group-hover:visible opacity-0 group-hover:opacity-100
                                  transition-all duration-200">
                    <div className="px-4 py-2 border-b border-surface-tertiary">
                      <p className="text-sm font-medium text-ink truncate">
                        {profile?.username ?? 'User'}
                      </p>
                    </div>
                    {AUTH_NAV_LINKS.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="block px-4 py-2 text-sm text-ink-secondary
                                   hover:text-ink hover:bg-surface-secondary transition-colors"
                      >
                        {link.label}
                      </Link>
                    ))}
                    <div className="border-t border-surface-tertiary mt-1 pt-1">
                      <button
                        onClick={signOut}
                        className="w-full text-left px-4 py-2 text-sm text-red-500
                                   hover:bg-red-50 transition-colors"
                      >
                        Log Out
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="btn-secondary hidden sm:inline-flex">
                  Log In
                </Link>
                <Link href="/register" className="btn-primary hidden sm:inline-flex">
                  Sign Up
                </Link>
              </>
            )}

            {/* Mobil hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-xl text-ink-secondary hover:bg-surface-secondary transition-colors"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* ── Mobil Menü ── */}
        {mobileOpen && (
          <div className="md:hidden border-t border-surface-tertiary py-4 space-y-1 animate-slide-up">
            {categoryTree.map((cat) => (
              <div key={cat.id}>
                <button
                  onClick={() => setOpenDropdown(openDropdown === cat.id ? null : cat.id)}
                  className="w-full flex items-center justify-between px-4 py-2.5
                             text-sm font-medium text-ink rounded-xl hover:bg-surface-secondary"
                >
                  {cat.name}
                  <svg
                    className={cn('w-4 h-4 transition-transform', openDropdown === cat.id && 'rotate-180')}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openDropdown === cat.id && cat.children?.length > 0 && (
                  <div className="pl-4 space-y-1 mt-1">
                    {cat.children.map((sub) => (
                      <Link
                        key={sub.id}
                        href={`/category/${sub.slug}`}
                        className="block px-4 py-2 text-sm text-ink-secondary
                                   rounded-xl hover:bg-surface-secondary transition-colors"
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Mobil auth linkleri */}
            <div className="border-t border-surface-tertiary pt-3 mt-3 space-y-1">
              {user ? (
                <>
                  <Link href="/post-ad" className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-brand-500">
                    <Plus className="w-4 h-4" /> Post Ad
                  </Link>
                  {AUTH_NAV_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="block px-4 py-2.5 text-sm text-ink-secondary"
                    >
                      {link.label}
                    </Link>
                  ))}
                  <button
                    onClick={signOut}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-500"
                  >
                    Log Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="block px-4 py-2.5 text-sm font-medium text-ink">Log In</Link>
                  <Link href="/register" className="block px-4 py-2.5 text-sm font-medium text-brand-500">Sign Up</Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
