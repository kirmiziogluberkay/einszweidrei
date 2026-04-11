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

let client;

export function createClient() {
  if (client) return client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  client = createBrowserClient(
    supabaseUrl,
    supabaseKey
  );

  return client;
}

