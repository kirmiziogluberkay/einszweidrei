/**
 * components/layout/Navbar.jsx
 * ─────────────────────────────────────────────────────
 * Üst navigasyon çubuğu — ULTRA STABLE VERSION (No Hook)
 * ─────────────────────────────────────────────────────
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Plus, User, Menu, X, ShieldCheck, ChevronDown, LogOut, LayoutGrid, Heart, MessageSquare } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCategories } from '@/hooks/useCategories';
import { SITE_NAME, AUTH_NAV_LINKS } from '@/constants/config';
import { cn, formatUsername } from '@/lib/helpers';

export default function Navbar() {
  const pathname = usePathname();
  const { user, profile, isAdmin, signOut } = useAuth();
  const { categoryTree = [] } = useCategories();
  
  // Static state to guarantee NO crashes
  const unreadCount = 0;

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

  const safeUsername = profile?.username ? formatUsername(profile.username) : 'User';

  return (
    <header className={cn(
      'sticky top-0 z-50 transition-all duration-300',
      scrolled 
        ? 'glass border-b border-surface-tertiary shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)]' 
        : 'bg-white border-b border-surface-tertiary'
    )}>
      <nav className="container-app h-14 md:h-16 flex items-center justify-between gap-4">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group transition-transform active:scale-95 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-brand-500 shadow-[0_4px_12px_rgba(14,165,233,0.3)] flex items-center justify-center">
             <span className="text-white font-black text-lg leading-none">1</span>
          </div>
          <span className="text-lg font-black text-ink tracking-tight md:block hidden lowercase">{SITE_NAME}</span>
        </Link>

        {/* Categories Navigation */}
        <div className="hidden md:flex items-center gap-1 flex-1 px-8 overflow-hidden">
          {categoryTree.slice(0, 5).map((cat) => (
            <Link key={cat.id} href={`/category/${cat.id}`} className="px-3 py-2 text-sm font-bold text-ink-secondary hover:text-brand-500 transition-colors whitespace-nowrap">
              {cat.name}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
            {!user ? (
               <Link href="/login" className="btn-primary py-2 px-5 text-sm h-10">Login</Link>
            ) : (
               <div className="relative group flex items-center">
                 <button className="flex items-center gap-2 p-1 rounded-2xl hover:bg-surface-secondary transition-all">
                    <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center font-black text-xs border border-brand-100 shadow-sm relative">
                       {safeUsername.charAt(0)}
                    </div>
                    <span className="text-sm font-bold text-ink pr-1 md:block hidden">{safeUsername}</span>
                 </button>

                 <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-[var(--shadow-xl)] border border-surface-tertiary py-3 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <div className="px-5 py-2 mb-2 border-b border-surface-tertiary/50">
                       <p className="text-[10px] text-ink-tertiary uppercase font-black tracking-widest leading-none mb-1.5">Welcome</p>
                       <p className="font-black text-ink">{safeUsername}</p>
                    </div>
                    {(AUTH_NAV_LINKS || []).map((link) => (
                      <Link key={link.href} href={link.href} className="flex items-center gap-3 px-5 py-2.5 text-sm text-ink-secondary hover:text-brand-500 hover:bg-surface-secondary/50 transition-colors">
                        {link.label}
                      </Link>
                    ))}
                    <div className="mt-2 pt-2 border-t border-surface-tertiary/50">
                       <button onClick={() => signOut()} className="w-full flex items-center gap-3 px-5 py-2.5 text-sm text-red-500 hover:bg-red-50/50 transition-colors text-left">
                         <LogOut className="w-4 h-4" />
                         <span className="font-bold">Log Out</span>
                       </button>
                    </div>
                 </div>
               </div>
            )}
            <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}><Menu /></button>
        </div>
      </nav>
    </header>
  );
}
