'use client';

/**
 * hooks/useAuth.js
 * ─────────────────────────────────────────────────────
 * Kimlik doğrulama durumunu ve kullanıcı profilini
 * yöneten custom React hook.
 * ─────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { USER_ROLES } from '@/constants/config';

/**
 * Oturum, kullanıcı ve profil bilgilerini döndüren hook.
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

  /** Supabase auth kullanıcısı */
  const [user, setUser] = useState(null);

  /** Veritabanından gelen profil bilgisi */
  const [profile, setProfile] = useState(null);

  /** İlk yükleme durumu */
  const [loading, setLoading] = useState(true);

  /**
   * Kullanıcı id'sine göre profil kaydını çeker.
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
   * Kullanıcının oturumunu kapatır.
   */
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, [supabase.auth]);

  /**
   * Profil bilgilerini manuel olarak yeniler.
   */
  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  return {
    user,
    profile,
    /** Kullanıcının admin rolüne sahip olup olmadığı */
    isAdmin: profile?.role === USER_ROLES.ADMIN,
    loading,
    signOut,
    refreshProfile,
  };
}
