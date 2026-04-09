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
let supabaseInstance;

export function createClient() {
  if (supabaseInstance) return supabaseInstance;

  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mzpapilwofbcaqotdxgu.supabase.co').trim();
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_M8uqQEfLmxlGMRc49MDp7w_ymKWWVjk').trim();

  supabaseInstance = createBrowserClient(url, key);

  return supabaseInstance;
}
