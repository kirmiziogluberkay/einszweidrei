/**
 * lib/supabase/server.js
 * ─────────────────────────────────────────────────────
 * Server-side Supabase client (Server Components & Actions).
 * Cookie management is handled via Next.js `cookies()` API.
 * ─────────────────────────────────────────────────────
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Creates a server-side Supabase client.
 * Called once per Server Component render.
 *
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export function createClient() {
  const cookieStore = cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';

  /** @type {import('@supabase/ssr').CookieMethodsServer} */
  const cookieMethods = {
    getAll() {
      return cookieStore.getAll();
    },
    setAll(cookiesToSet) {
      try {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        );
      } catch {
        // Silently ignored when called from a read-only Server Component.
      }
    },
  };

  // @ts-ignore -- false positive: our cookies object uses getAll/setAll (non-deprecated);
  // TypeScript loses overload precision on plain JS object literals in .js files.
  return createServerClient(supabaseUrl, supabaseKey, { cookies: cookieMethods });
}
