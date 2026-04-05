/**
 * app/layout.js
 * ─────────────────────────────────────────────────────
 * Root layout — tüm sayfaları sarar.
 * PWA meta etiketleri, font ve global navbar buradadır.
 * ─────────────────────────────────────────────────────
 */

import './globals.css';
import { SITE_NAME, SITE_DESCRIPTION, PWA_CONFIG, SITE_URL } from '@/constants/config';
import Navbar from '@/components/layout/Navbar';
import MobileNav from '@/components/layout/MobileNav';
import Footer from '@/components/layout/Footer';

/** @type {import('next').Metadata} */
export const metadata = {
  // ── Temel meta ─────────────────────────────────────
  title: {
    default:  SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  metadataBase: new URL(SITE_URL),

  // ── Open Graph (sosyal paylaşım) ────────────────────
  openGraph: {
    title:       SITE_NAME,
    description: SITE_DESCRIPTION,
    url:         SITE_URL,
    siteName:    SITE_NAME,
    locale:      'tr_TR',
    type:        'website',
  },

  // ── PWA ────────────────────────────────────────────
  manifest: '/manifest.json',
  appleWebApp: {
    capable:    true,
    title:      SITE_NAME,
    statusBarStyle: 'default',
  },

  // ── Diğer ──────────────────────────────────────────
  robots: {
    index:  true,
    follow: true,
  },
};

export const viewport = {
  themeColor: PWA_CONFIG.themeColor,
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

/**
 * Root layout bileşeni.
 * Tüm sayfa içerikleri `children` olarak enjekte edilir.
 *
 * @param {{ children: React.ReactNode }} props
 */
export default function RootLayout({ children }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        {/* PWA: Apple Touch Icon */}
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        {/* Viewport: mobil optimizasyon */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className="flex flex-col min-h-screen bg-surface-secondary">

        {/* ── Üst navigasyon (Desktop & Mobile) ── */}
        <Navbar />

        {/* ── Ana içerik ── */}
        <main className="flex-1 pb-16 md:pb-0">
          {children}
        </main>

        {/* ── Alt navigasyon (sadece mobil) ── */}
        <MobileNav />

        {/* ── Footer (sadece desktop) ── */}
        <Footer />

      </body>
    </html>
  );
}
