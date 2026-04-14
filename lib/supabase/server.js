/**
 * lib/supabase/server.js — STUB (Supabase removed)
 * This file is kept for import compatibility during migration.
 * All data operations now use lib/github-db.js and iron-session.
 */
export function createClient() {
  throw new Error(
    '[supabase/server] Supabase has been removed. Use lib/github-db.js and lib/auth-session.js instead.'
  );
}
