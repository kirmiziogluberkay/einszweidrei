// update1547
// notification: green theme applied
/**
 * components/layout/MobileNav.jsx
 * ─────────────────────────────────────────────────────
 * Bottom tab bar navigation shown on mobile devices.
 * Integrated Notification Dot Version
 * ─────────────────────────────────────────────────────
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Plus, MessageSquare, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';

const NAV_ITEMS = [
  { label: 'Home', href: '/', icon: Home, authRequired: false },
  { label: 'Search', href: '/search', icon: Search, authRequired: false },
  { label: 'New Ad', href: '/post-ad', icon: Plus, authRequired: true, featured: true },
  { label: 'Inbox', href: '/inbox', icon: MessageSquare, authRequired: true },
  { label: 'Profile', href: '/myprofile', icon: User, authRequired: false },
];

export default function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [hasUnread, setHasUnread] = useState(false);
  
  // Integrated Sync
  useEffect(() => {
    if (!user?.id) {
       setHasUnread(false);
       return;
    }

    const supabase = createClient();
    const checkMail = async () => {
       try {
         const { data, error } = await supabase
           .from('messages')
           .select('id')
           .eq('receiver_id', user.id)
           .eq('is_read', false)
           .limit(1);
         
         if (!error) setHasUnread(data && data.length > 0);
       } catch (e) {}
    };

    checkMail();

    const channel = supabase
       .channel(`mn-inbox-${user.id}`)
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

  if (pathname.startsWith('/admin')) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/80 backdrop-blur-xl border-t border-surface-tertiary">
      <div className="flex items-center justify-around h-16">
        {NAV_ITEMS.map((item) => {
          if (item.authRequired && !user) return null;
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center gap-1 min-w-[64px] ${active ? 'text-brand-500' : 'text-ink-tertiary'}`}
            >
              {item.featured ? (
                 <div className="w-12 h-12 rounded-2xl bg-brand-500 flex items-center justify-center text-white shadow-lg -mt-8 border-4 border-white active:scale-95 transition-transform">
                     <Plus className="w-8 h-8" strokeWidth={3} />
                 </div>
              ) : (
                 <div className="relative flex flex-col items-center">
                   <Icon className={`w-6 h-6 transition-transform ${active ? 'scale-110' : ''}`} />
                   <span className="text-[10px] uppercase tracking-tighter mt-1">{item.label}</span>
                   
                   {/* Integrated Red Dot */}
                   {item.label === 'Inbox' && hasUnread && (
                      <span className="absolute top-0 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white shadow-sm" />
                   )}
                 </div>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
