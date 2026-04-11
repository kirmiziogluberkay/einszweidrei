// force-rebuild-v1
// update 21:46: Search bar removed.
/**
 * components/layout/Navbar.jsx
 * ─────────────────────────────────────────────────────
 * Top navigation bar — Integrated Notification System
 * ─────────────────────────────────────────────────────
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Plus, Menu, X, ShieldCheck, LogOut, Mail, Search } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { AUTH_NAV_LINKS } from '@/constants/config';
import { cn, formatUsername } from '@/lib/helpers';

export default function Navbar() {
   const pathname = usePathname();
   const router = useRouter();
   const { user, profile, loading, signOut } = useAuth();

   // Global Search State
   const [searchQuery, setSearchQuery] = useState('');
   const handleSearchSubmit = (e) => {
      e.preventDefault();
      if (!searchQuery.trim()) return;
      router.push(`/?q=${encodeURIComponent(searchQuery.trim())}`);
   };

   const handleSignOut = async () => {
      router.push('/');
      await signOut();
   };

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
            supabase.removeChannel(channel).catch(() => { });
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

   /** Close menu when page changes */
   useEffect(() => {
      setMobileOpen(false);
   }, [pathname]);

   /** Scroll effect */
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
            <Link href="/" className="flex flex-col group shrink-0">
               <span className="text-xl font-black text-ink tracking-tighter leading-none">EinsZweiDrei</span>
               <span className="text-[10px] text-ink-tertiary font-medium">The ultimate shortcut for buyers and sellers.</span>
            </Link>

            {/* Middle: Universal Search Bar */}
            <div className="flex-1 max-w-xl mx-4 hidden md:block">
              <form onSubmit={handleSearchSubmit} className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-tertiary" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search among all ads..."
                  className="w-full bg-surface-secondary/50 border border-surface-tertiary focus:border-brand-500 focus:bg-white rounded-xl py-2 pl-9 pr-4 text-base outline-none transition-all"
                />
              </form>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4 shrink-0">
               <Link href="/post-ad" className="btn-primary py-2 px-5 text-sm h-10 gap-1.5 md:flex hidden rounded-xl">
                  <Plus className="w-4 h-4" />
                  <span>New Ad</span>
               </Link>

               {/* Auth Section */}
               {!loading && (
                  <>
                     {!user ? (
                        <div className="flex items-center gap-2">
                           <Link href="/register" className="hidden md:flex btn-secondary py-2 px-4 text-sm h-10 rounded-xl">Sign Up</Link>
                           <Link href="/login" className="btn-primary py-2 px-5 text-sm h-10 rounded-xl">Login</Link>
                        </div>
                     ) : (
                        <div className="flex items-center gap-3">
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
                                       className="flex justify-between items-center px-4 py-2 text-sm text-ink-secondary hover:text-brand-500 hover:bg-surface-secondary/50 transition-colors"
                                    >
                                       <span>{link.label}</span>
                                       {(link.label === 'Messages' || link.label === 'Inbox') && hasUnread && (
                                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                                       )}
                                    </Link>
                                 ))}
                                 <div className="mt-1 pt-1 border-t border-surface-tertiary/50 px-2">
                                    <button onClick={handleSignOut} className="w-full flex items-center gap-2 px-2 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors text-left font-bold">
                                       <LogOut className="w-3.5 h-3.5" />
                                       <span>Log Out</span>
                                    </button>
                                 </div>
                              </div>
                           </div>

                           {/* Admin Shortcut Button - Next to Profile */}
                           {profile?.role === 'admin' && (
                              <Link
                                 href="/admin"
                                 className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-100 rounded-xl transition-all shadow-sm"
                              >
                                 <ShieldCheck className="w-3.5 h-3.5" />
                                 <span className="md:inline hidden text-xs">Admin</span>
                              </Link>
                           )}
                        </div>
                     )}
                  </>
               )}

               <button className="md:hidden p-3 -mr-1" onClick={() => setMobileOpen(!mobileOpen)}>
                  {mobileOpen ? <X /> : <Menu />}
               </button>
            </div>
         </nav>

         {/* ── Mobile Menu Drawer ── */}
         {mobileOpen && (
            <div className="md:hidden border-t border-surface-tertiary bg-white shadow-lg">
               <div className="container-app py-4 space-y-1">
                  {!user ? (
                     <>
                        <Link href="/" className="flex items-center px-4 py-3 text-sm font-medium text-ink rounded-xl hover:bg-surface-secondary transition-colors">Home</Link>
                        <Link href="/search" className="flex items-center px-4 py-3 text-sm font-medium text-ink rounded-xl hover:bg-surface-secondary transition-colors">Search</Link>
                        <div className="border-t border-surface-tertiary my-2" />
                        <Link href="/register" className="flex items-center px-4 py-3 text-sm font-medium text-brand-600 rounded-xl hover:bg-brand-50 transition-colors">Sign Up</Link>
                        <Link href="/login" className="flex items-center px-4 py-3 text-sm font-bold text-white bg-brand-500 rounded-xl hover:bg-brand-600 transition-colors">Log In</Link>
                     </>
                  ) : (
                     <>
                        <div className="flex items-center gap-3 px-4 py-3 mb-1">
                           <div className="w-9 h-9 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-sm border border-brand-100">
                              {usernameDisplay?.charAt(0).toUpperCase() ?? '?'}
                           </div>
                           <div>
                              <p className="text-sm font-bold text-ink">{usernameDisplay}</p>
                              <p className="text-xs text-ink-tertiary">{user.email}</p>
                           </div>
                        </div>
                        <div className="border-t border-surface-tertiary my-2" />
                        <Link href="/post-ad" className="flex items-center px-4 py-3 text-sm font-medium text-ink rounded-xl hover:bg-surface-secondary transition-colors">New Ad</Link>
                        <Link href="/myprofile" className="flex items-center px-4 py-3 text-sm font-medium text-ink rounded-xl hover:bg-surface-secondary transition-colors">My Profile</Link>
                        <Link href="/inbox" className="flex items-center justify-between px-4 py-3 text-sm font-medium text-ink rounded-xl hover:bg-surface-secondary transition-colors">
                           <span>Inbox</span>
                           {hasUnread && <span className="w-2 h-2 bg-green-500 rounded-full" />}
                        </Link>
                        {profile?.role === 'admin' && (
                           <Link href="/admin" className="flex items-center px-4 py-3 text-sm font-medium text-brand-600 rounded-xl hover:bg-brand-50 transition-colors">Admin Panel</Link>
                        )}
                        <div className="border-t border-surface-tertiary my-2" />
                        <button onClick={handleSignOut} className="w-full flex items-center gap-2 px-4 py-3 text-sm font-bold text-red-500 rounded-xl hover:bg-red-50 transition-colors">
                           <LogOut className="w-4 h-4" /> Log Out
                        </button>
                     </>
                  )}
               </div>
            </div>
         )}
      </header>
   );
}
