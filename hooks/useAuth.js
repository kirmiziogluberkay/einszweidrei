'use client';

/**
 * hooks/useAuth.js
 * ─────────────────────────────────────────────────────
 * Custom React hook that manages authentication state
 * and the current user's profile.
 * ─────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { USER_ROLES } from '@/constants/config';

/**
 * Hook that returns session, user, and profile information.
 *
 * @returns {{
 *   user: import('@supabase/supabase-js').User | null,
 *   profile: {id:string, username:string, role:string} | null,
 *   isAdmin: boolean,
 *   loading: boolean,
 *   signOut: () => Promise<void>
 * }}
 */
export function useAuth() {
  const supabase = createClient();

  /** Supabase auth user */
  const [user, setUser] = useState(null);

  /** Profile record from the database */
  const [profile, setProfile] = useState(null);

  /** Initial loading state */
  const [loading, setLoading] = useState(true);

  /**
   * Fetches the profile record for the given user ID.
   *
   * @param {string} userId
   */
  const fetchProfile = useCallback(async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, role, avatar_url, phone')
      .eq('id', userId)
      .single();

    setProfile(data ?? null);
  }, [supabase]);

  useEffect(() => {
    // Current user
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user ?? null);
      if (user) {
        await fetchProfile(user.id);
      }
      setLoading(false);
    });

    // Auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        await fetchProfile(u.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase, fetchProfile]);

  /**
   * Signs out the current user.
   */
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, [supabase.auth]);

  /**
   * Manually refreshes the profile data.
   */
  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  return {
    user,
    profile,
    /** Whether the current user has the admin role */
    isAdmin: profile?.role === USER_ROLES.ADMIN,
    loading,
    signOut,
    refreshProfile,
  };
}
