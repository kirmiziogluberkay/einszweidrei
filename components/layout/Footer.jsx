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
         {/* Grid bölümleri kullanıcının talebi üzerine kaldırıldı */}

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
