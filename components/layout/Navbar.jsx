/**
 * components/layout/Navbar.jsx
 * ─────────────────────────────────────────────────────
 * Üst navigasyon çubuğu — Clean Minimal Version
 * ─────────────────────────────────────────────────────
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Plus, User, Menu, X, ShieldCheck, ChevronDown, LogOut, LayoutGrid, Heart, MessageSquare } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { SITE_NAME, AUTH_NAV_LINKS } from '@/constants/config';
import { cn, formatUsername } from '@/lib/helpers';

export default function Navbar() {
  const pathname = usePathname();
  const { user, profile, isAdmin, signOut } = useAuth();
  const { hasUnread = false } = useNotifications() || {};

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
      <nav className="container-app h-14 md:h-16 flex items-center justify-between gap-6">
        
        {/* Logo — No badge, clean text */}
        <Link href="/" className="flex items-center gap-2 group transition-transform active:scale-95 shrink-0">
          <span className="text-xl font-black text-ink tracking-tighter lowercase">{SITE_NAME}</span>
        </Link>

        {/* Center: Search — Expanded since Categories are removed */}
        <div className="flex-1 max-w-2xl hidden md:flex items-center justify-center">
             <div className="relative group w-full">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-ink-tertiary group-focus-within:text-brand-500 transition-colors" />
               <input 
                 type="text" 
                 placeholder="Search for items, categories or brands..." 
                 className="h-11 pl-11 pr-4 bg-surface-secondary border-none rounded-2xl text-sm w-full focus:ring-4 ring-brand-500/10 transition-all"
               />
            </div>
        </div>

        {/* Right side Tools */}
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
            {/* Post Ad Button */}
            <Link href="/ilan-ver" className="btn-primary py-2 px-5 text-sm h-11 gap-1.5 md:flex hidden rounded-2xl shadow-sm">
               <Plus className="w-5 h-5" />
               <span className="font-bold">Post your ad</span>
            </Link>

            {!user ? (
               <Link href="/login" className="btn-primary py-2 px-6 text-sm h-11 rounded-2xl">Login</Link>
            ) : (
               <div className="relative group flex items-center">
                 <button className="flex items-center gap-2.5 p-1 rounded-2xl hover:bg-surface-secondary transition-all">
                    <div className="relative w-9 h-9 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center font-black text-sm border border-brand-100 shadow-sm transition-transform active:scale-95">
                       {safeUsername.charAt(0)}
                       {hasUnread && (
                          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white shadow-sm animate-pulse" />
                       )}
                    </div>
                    <span className="text-sm font-bold text-ink pr-1 md:block hidden">{safeUsername}</span>
                 </button>

                 {/* User Dropdown */}
                 <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl shadow-[var(--shadow-xxl)] border border-surface-tertiary py-3 invisible group-hover:visible opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200">
                    <div className="px-5 py-3 mb-2 border-b border-surface-tertiary/50">
                       <p className="text-[10px] text-ink-tertiary uppercase font-black tracking-widest leading-none mb-1.5">Your Account</p>
                       <p className="font-black text-ink text-base truncate">{safeUsername}</p>
                    </div>
                    
                    {(AUTH_NAV_LINKS || []).map((link) => (
                      <Link 
                        key={link.href} 
                        href={link.href}
                        className="flex justify-between items-center px-5 py-2.5 text-sm font-bold text-ink-secondary hover:text-brand-500 hover:bg-surface-secondary/50 transition-all"
                      >
                        <div className="flex items-center gap-3">
                           {link.label === 'Messages' && <MessageSquare className="w-4 h-4" />}
                           {link.label === 'Ads' && <LayoutGrid className="w-4 h-4" />}
                           {link.label === 'Profile' && <User className="w-4 h-4" />}
                           <span>{link.label}</span>
                        </div>
                        {link.label === 'Messages' && hasUnread && (
                           <span className="w-2.5 h-2.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                        )}
                      </Link>
                    ))}

                    <div className="mt-3 pt-2 border-t border-surface-tertiary/50">
                       <button 
                         onClick={() => signOut()}
                         className="w-full flex items-center gap-3 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-50 transition-colors text-left"
                       >
                         <LogOut className="w-4 h-4" />
                         <span>Log Out</span>
                       </button>
                    </div>
                 </div>
               </div>
            )}
            
            {/* Mobile Menu Trigger */}
            <button className="md:hidden p-2 text-ink" onClick={() => setMobileOpen(!mobileOpen)}>
               {mobileOpen ? <X /> : <Menu />}
            </button>
        </div>
      </nav>
    </header>
  );
}
