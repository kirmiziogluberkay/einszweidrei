/**
 * components/layout/Navbar.jsx
 * ─────────────────────────────────────────────────────
 * Üst navigasyon çubuğu — ULTRA GÜVENLİ VERSİYON
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
  
  // Çökmeyi engellemek için statik değerler
  const unreadCount = 0;
  const username = profile?.username || 'User';

  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
    setOpenDropdown(null);
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={cn('sticky top-0 z-50 transition-all bg-white border-b border-surface-tertiary', scrolled ? 'shadow-sm' : '')}>
      <nav className="container-app h-14 md:h-16 flex items-center justify-between gap-4">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group transition-transform active:scale-95 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-brand-500 shadow-[0_4px_12px_rgba(14,165,233,0.3)] flex items-center justify-center">
             <span className="text-white font-black text-lg leading-none">1</span>
          </div>
          <span className="text-lg font-black text-ink tracking-tight sm:block hidden">{SITE_NAME}</span>
        </Link>

        {/* Center: Search & Categories */}
        <div className="flex-1 max-w-xl mx-auto md:flex hidden">
             {/* Kategori ve arama alanı buraya */}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
            {!user ? (
               <Link href="/login" className="btn-primary py-2 px-4 text-sm">Login</Link>
            ) : (
               <div className="relative group">
                 <button className="flex items-center gap-2 p-1 rounded-full border border-surface-tertiary">
                    <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center font-bold text-brand-600">
                       {username.charAt(0).toUpperCase()}
                    </div>
                 </button>
                 {/* Dropdown can be restored after stability confirmed */}
               </div>
            )}
        </div>

      </nav>
    </header>
  );
}
