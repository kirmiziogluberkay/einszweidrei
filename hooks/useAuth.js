'use client';

/**
 * hooks/useAuth.js
 * ─────────────────────────────────────────────────────
 * Custom React hook that manages authentication state
 * and the current user's profile.
 * ─────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();

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
    // Current user — with safety timeout to prevent a hung token refresh
    // from freezing the UI indefinitely in normal (non-incognito) mode.
    const initAuth = async () => {
      try {
        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('auth_timeout')), 8000)
        );
        const { data: { user } } = await Promise.race([
          supabase.auth.getUser(),
          timeout,
        ]);
        setUser(user ?? null);
        if (user) await fetchProfile(user.id);
      } catch (err) {
        if (err.message === 'auth_timeout') {
          console.warn('[Auth] Session check timed out — clearing stale token.');
          await supabase.auth.signOut();
        }
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

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
    queryClient.clear();
    await supabase.auth.signOut();
  }, [supabase.auth, queryClient]);

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
