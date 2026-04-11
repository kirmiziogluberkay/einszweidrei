/**
 * lib/supabase/client.js
 * ─────────────────────────────────────────────────────
 * Browser-side Supabase client (Client Components).
 * Singleton pattern — created once per module lifetime.
 * ─────────────────────────────────────────────────────
 */

import { createBrowserClient } from '@supabase/ssr';

let client;

/**
 * Returns the shared browser-side Supabase client.
 *
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export function createClient() {
  if (client) return client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  client = createBrowserClient(supabaseUrl, supabaseKey);

  return client;
}
