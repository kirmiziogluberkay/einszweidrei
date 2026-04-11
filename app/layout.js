/**
 * app/layout.js
 * ─────────────────────────────────────────────────────
 * Root layout — wraps all pages.
 * PWA meta tags, font and global navbar are here.
 * ─────────────────────────────────────────────────────
 */

import './globals.css';
import { SITE_NAME, SITE_DESCRIPTION, PWA_CONFIG, SITE_URL } from '@/constants/config';
import Navbar from '@/components/layout/Navbar';
import MobileNav from '@/components/layout/MobileNav';
import Footer from '@/components/layout/Footer';
import Marquee from '@/components/layout/Marquee';
import { AuthProvider } from '@/providers/AuthProvider';
import { QueryProvider } from '@/components/QueryProvider';

/** @type {import('next').Metadata} */
export const metadata = {
  // ── Basic meta ─────────────────────────────────────
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  metadataBase: new URL(SITE_URL),

  // ── Open Graph (social sharing) ────────────────────
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: 'en_US',
    type: 'website',
  },

  // ── PWA ────────────────────────────────────────────
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: 'default',
  },

  // ── Other ──────────────────────────────────────────
  robots: {
    index: true,
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
 * Root layout component.
 * All page contents are injected as `children`.
 *
 * @param {{ children: React.ReactNode }} props
 */
export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* PWA: Apple Touch Icon */}
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        {/* Viewport: mobile optimization */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className="flex flex-col min-h-screen bg-surface-secondary">
        <AuthProvider>
          <QueryProvider>
            <Marquee />

            {/* ── Top navigation (Desktop & Mobile) ── */}
            <Navbar />

            {/* ── Main content ── */}
            <main className="flex-1 main-content md:pb-0">
              {children}
            </main>

            {/* ── Bottom navigation (mobile only) ── */}
            <MobileNav />

            {/* ── Footer (desktop only) ── */}
            <Footer />
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
