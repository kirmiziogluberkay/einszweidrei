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
export async function createClient() {
  // Next.js 14 App Router'da cookies() async'dir
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lvhdbxjckmzqwertyuiop.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2aGRieGpjbXpxd2VydHl1aW9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzEwMzExMTcsImV4cCI6MTk4NjYwNzExN30.MISSING_KEY_DUMMY_SIGNATURE';

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
