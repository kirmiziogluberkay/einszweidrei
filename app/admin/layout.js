/**
 * app/admin/layout.js
 * ─────────────────────────────────────────────────────
 * Admin paneli layout — sol kenar çubuklu.
 * Sadece admin rolündeki kullanıcılar erişebilir
 * (middleware tarafından korunur).
 * ─────────────────────────────────────────────────────
 */

import Link from 'next/link';
import { LayoutDashboard, Megaphone, FolderTree, MessageSquare, ArrowLeft } from 'lucide-react';

/** Admin yan menü linkleri */
const ADMIN_NAV = [
  { label: 'Overview',           href: '/admin',            icon: LayoutDashboard   },
  { label: 'Ads Management',     href: '/admin/ilanlar',    icon: Megaphone         },
  { label: 'Category Management',href: '/admin/kategoriler',icon: FolderTree        },
  { label: 'Inboxes',            href: '/admin/inbox',      icon: MessageSquare     },
];

export default function AdminLayout({ children }) {
  return (
    <div className="flex min-h-[calc(100vh-56px)]">

      {/* ── Kenar çubuğu ── */}
      <aside className="hidden md:flex flex-col w-64 bg-ink text-white flex-shrink-0">
        <div className="p-5 border-b border-white/10">
          <p className="font-bold text-sm uppercase tracking-widest text-white/60">Admin Paneli</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {ADMIN_NAV.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/70
                         hover:text-white hover:bg-white/10 transition-colors"
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-white/50 hover:text-white/80 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Siteye Dön
          </Link>
        </div>
      </aside>

      {/* ── İçerik ── */}
      <main className="flex-1 bg-surface-secondary p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
}
