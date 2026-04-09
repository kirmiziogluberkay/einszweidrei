/**
 * lib/supabase/client.js
 * ─────────────────────────────────────────────────────
 * Tarayıcı (client component) tarafında kullanılan
 * Supabase istemcisi. Singleton pattern uygulanır.
 * ─────────────────────────────────────────────────────
 */

import { createBrowserClient } from '@supabase/ssr';

/**
 * Tarayıcı tarafı Supabase istemcisi.
 * Her render'da yeniden oluşturulmaması için
 * modül seviyesinde önbelleğe alınır.
 *
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
let supabase;

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lvhdbxjckmzqwertyuiop.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2aGRieGpjbXpxd2VydHl1aW9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzEwMzExMTcsImV4cCI6MTk4NjYwNzExN30.MISSING_KEY_DUMMY_SIGNATURE';

  if (supabase) return supabase;

  supabase = createBrowserClient(supabaseUrl, supabaseKey, {
    global: {
      fetch: (url, options) => {
        return fetch(url, { ...options, cache: 'no-store' });
      },
    },
  });

  return supabase;
}
