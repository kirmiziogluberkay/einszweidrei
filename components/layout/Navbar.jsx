// force-rebuild-v1
// update 21:46: Search bar removed.
/**
 * components/layout/Navbar.jsx
 * ─────────────────────────────────────────────────────
 * Üst navigasyon çubuğu — Integrated Notification System
 * ─────────────────────────────────────────────────────
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus, User, Menu, X, ShieldCheck, ChevronDown, LogOut, Mail } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { SITE_NAME, AUTH_NAV_LINKS } from '@/constants/config';
import { cn, formatUsername } from '@/lib/helpers';

export default function Navbar() {
  const pathname = usePathname();
  const { user, profile, authLoading, signOut } = useAuth();
  
  // Local state for notifications to prevent global hook crashes
  const [hasUnread, setHasUnread] = useState(false);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Integrated Notification Check
  useEffect(() => {
    if (!user?.id) {
       setHasUnread(false);
       return;
    }

    const supabase = createClient();

    const checkMail = async () => {
       try {
         const { count, error } = await supabase
           .from('messages')
           .select('*', { count: 'exact', head: true })
           .eq('receiver_id', user.id)
           .eq('is_read', false);
         
         if (!error) setHasUnread(count > 0);
       } catch (e) {
         console.warn('Silent sync issue');
       }
    };

    checkMail();

    // Listen to real-time changes
    const channel = supabase
       .channel(`nv-inbox-${user.id}`)
       .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
       }, () => {
          checkMail();
       })
       .subscribe();

    return () => {
       if (supabase && channel) {
          supabase.removeChannel(channel).catch(() => {});
       }
    };
  }, [user?.id]);

  const [menuOpened, setMenuOpened] = useState(false);

  // Integrated Notification Check
  useEffect(() => {
    // New unread message logic: reset acknowledgment if new ones arrive
    if (hasUnread) {
       setMenuOpened(false);
    }
  }, [hasUnread]);

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

  const usernameDisplay = profile?.username ? formatUsername(profile.username) : null;

  return (
    <header className={cn(
      'sticky top-0 z-50 transition-all duration-300',
      scrolled 
        ? 'glass border-b border-surface-tertiary shadow-[var(--shadow-sm)]' 
        : 'bg-white border-b border-surface-tertiary'
    )}>
      <nav className="container-app h-14 md:h-16 flex items-center justify-between gap-6">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <span className="text-xl font-black text-ink tracking-tighter">EinsZweiDrei</span>
        </Link>



        {/* Right side */}
        <div className="flex items-center gap-4 shrink-0">
            <Link href="/ilan-ver" className="btn-primary py-2 px-5 text-sm h-10 gap-1.5 md:flex hidden rounded-xl">
               <Plus className="w-4 h-4" />
               <span className="font-bold">Post Ad</span>
            </Link>

            {/* Auth Section */}
            {!authLoading && (
               <>
                  {!user ? (
                     <Link href="/login" className="btn-primary py-2 px-6 text-sm h-10 rounded-xl">Login</Link>
                  ) : (
                     <div className="relative group flex items-center">
                       <button 
                          className="flex items-center gap-2.5 p-1 rounded-2xl hover:bg-surface-secondary transition-all"
                       >
                          {!usernameDisplay ? (
                             <div className="flex items-center gap-2.5 opacity-0">
                                <div className="w-8 h-8 rounded-full bg-surface-tertiary/40" />
                                <div className="h-4 w-12 bg-surface-tertiary/30 rounded md:block hidden" />
                             </div>
                          ) : (
                             <>
                                <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-xs border border-brand-100 shadow-sm relative shrink-0">
                                   {usernameDisplay.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex items-center gap-1.5 md:flex hidden">
                                   <span className="text-sm font-bold text-ink truncate max-w-[100px]">{usernameDisplay}</span>
                                   {hasUnread && !menuOpened && (
                                      <Mail className="w-4 h-4 text-green-500 fill-green-50/20" />
                                   )}
                                </div>
                             </>
                          )}
                       </button>

                       {/* User Dropdown */}
                       <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-[var(--shadow-xl)] border border-surface-tertiary py-2 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200">

                          {(AUTH_NAV_LINKS || []).map((link) => (
                            <Link 
                              key={link.href} 
                              href={link.href} 
                              onClick={() => {
                                if (link.label === 'Messages' || link.label === 'Inbox') {
                                  setMenuOpened(true);
                                }
                              }}
                              className="flex justify-between items-center px-4 py-2 text-sm text-ink-secondary hover:text-brand-500 hover:bg-surface-secondary/50 transition-colors"
                            >
                              <span>{link.label}</span>
                              {(link.label === 'Messages' || link.label === 'Inbox') && hasUnread && (
                                 <Mail className="w-4 h-4 text-green-500 fill-green-50/20" />
                              )}
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
               </>
            )}
            
            <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
               {mobileOpen ? <X /> : <Menu />}
            </button>
        </div>
      </nav>
    </header>
  );
}
