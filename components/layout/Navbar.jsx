/**
 * components/layout/Navbar.jsx
 * ─────────────────────────────────────────────────────
 * Üst navigasyon çubuğu — FINAL STABLE VERSION
 * ─────────────────────────────────────────────────────
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Plus, User, Menu, X, ShieldCheck, ChevronDown, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { SITE_NAME, AUTH_NAV_LINKS } from '@/constants/config';
import { cn } from '@/lib/helpers';

export default function Navbar() {
  const pathname = usePathname();
  const { user, profile, signOut } = useAuth();
  
  // Dynamic features are disabled at navigation level for ultimate stability
  const hasUnread = false;

  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  /** Sayfa değişince menüyü kapat */
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  /** Scroll efekti */
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const usernameDisplay = profile?.username || 'User';

  return (
    <header className={cn(
      'sticky top-0 z-50 transition-all duration-300',
      scrolled 
        ? 'glass border-b border-surface-tertiary shadow-[var(--shadow-sm)]' 
        : 'bg-white border-b border-surface-tertiary'
    )}>
      <nav className="container-app h-14 md:h-16 flex items-center justify-between gap-6">
        
        {/* Logo — Clean & Minimal */}
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <span className="text-xl font-black text-ink tracking-tighter lowercase">{SITE_NAME}</span>
        </Link>

        {/* Center: Search — The focus point */}
        <div className="flex-1 max-w-2xl hidden md:flex items-center justify-center">
             <div className="relative group w-full">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-tertiary" />
               <input 
                 type="text" 
                 placeholder="Search ads..." 
                 className="h-10 pl-11 pr-4 bg-surface-secondary border-none rounded-2xl text-sm w-full focus:ring-2 ring-brand-500/10 transition-all"
               />
            </div>
        </div>

        {/* Right side Tools */}
        <div className="flex items-center gap-4 shrink-0">
            {/* Post Ad Button */}
            <Link href="/ilan-ver" className="btn-primary py-2 px-5 text-sm h-10 gap-1.5 md:flex hidden rounded-xl">
               <Plus className="w-4 h-4" />
               <span className="font-bold">Post Ad</span>
            </Link>

            {!user ? (
               <Link href="/login" className="btn-primary py-2 px-6 text-sm h-10 rounded-xl">Login</Link>
            ) : (
               <div className="relative group flex items-center">
                 <button className="flex items-center gap-2 p-1 rounded-2xl hover:bg-surface-secondary transition-all">
                    <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-xs border border-brand-100 shadow-sm relative">
                       {usernameDisplay.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-bold text-ink pr-1 md:block hidden">{usernameDisplay}</span>
                 </button>

                 {/* User Dropdown */}
                 <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-[var(--shadow-xl)] border border-surface-tertiary py-2 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <div className="px-4 py-2 mb-1 border-b border-surface-tertiary/50">
                       <p className="text-xs text-ink-tertiary font-medium">Account</p>
                       <p className="font-bold text-ink truncate">{usernameDisplay}</p>
                    </div>
                    {(AUTH_NAV_LINKS || []).map((link) => (
                      <Link key={link.href} href={link.href} className="flex px-4 py-2 text-sm text-ink-secondary hover:text-brand-500 hover:bg-surface-secondary/50 transition-colors">
                        {link.label}
                      </Link>
                    ))}
                    <div className="mt-1 pt-1 border-t border-surface-tertiary/50 px-2">
                       <button onClick={() => signOut()} className="w-full flex items-center gap-2 px-2 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors text-left font-bold">
                         <LogOut className="w-3.5 h-3.5" />
                         <span>Log Out</span>
                       </button>
                    </div>
                 </div>
               </div>
            )}
            
            {/* Mobile Menu */}
            <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
               {mobileOpen ? <X /> : <Menu />}
            </button>
        </div>
      </nav>
    </header>
  );
}
