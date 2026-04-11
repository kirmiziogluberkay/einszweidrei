/**
 * app/not-found.js
 * ─────────────────────────────────────────────────────
 * 404 — Page not found.
 * ─────────────────────────────────────────────────────
 */

import Link from 'next/link';
import { ERROR_MESSAGES } from '@/constants/config';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <div className="text-8xl font-bold gradient-text mb-4">404</div>
      <h1 className="text-2xl font-bold text-ink mb-3">Page Not Found</h1>
      <p className="text-ink-secondary text-sm mb-8 max-w-sm">
        {ERROR_MESSAGES.notFound}
      </p>
      <Link href="/" className="btn-primary">
        Return to Homepage
      </Link>
    </div>
  );
}
