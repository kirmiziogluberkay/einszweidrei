/**
 * lib/supabase/server.js
 * ─────────────────────────────────────────────────────
 * Server Component ve Server Action'larda kullanılan
 * Supabase istemcisi. Cookie yönetimi Next.js
 * `cookies()` API'si üzerinden yapılır.
 * ─────────────────────────────────────────────────────
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Sunucu taraflı Supabase istemcisi.
 * Her Server Component render'ında çağrılır.
 *
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export function createClient() {
  const cookieStore = cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        // Cookie okuma
        getAll() {
          return cookieStore.getAll();
        },
        // Cookie yazma (middleware veya Server Action içinde)
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component içinde setAll çağrılırsa
            // (read-only) hata fırlatır, yoksayılır.
          }
        },
      },
    }
  );
}
