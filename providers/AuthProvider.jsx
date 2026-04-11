'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { USER_ROLES } from '@/constants/config';

const AuthContext = createContext({
  user: null,
  profile: null,
  isAdmin: false,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider = ({ children }) => {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, role, avatar_url, phone')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        setProfile(null);
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
      setProfile(null);
    }
  }, [supabase]);

  useEffect(() => {
    // Initial user check — with a 8-second safety timeout so a hung token
    // refresh never leaves the UI frozen in the loading state indefinitely.
    const initAuth = async () => {
      try {
        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('auth_timeout')), 8000)
        );
        const authCheck = supabase.auth.getUser();

        const { data: { user: u } } = await Promise.race([authCheck, timeout]);
        setUser(u);
        if (u) {
          await fetchProfile(u.id);
        }
      } catch (err) {
        // On timeout or any unexpected error, treat the user as logged out
        // rather than leaving the app frozen.
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

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
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

  const signOut = async () => {
    // Clear all cached query data before signing out so stale authenticated
    // data (saved ads, messages, etc.) is never served to the next session.
    queryClient.clear();
    await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const value = {
    user,
    profile,
    isAdmin: profile?.role === USER_ROLES.ADMIN,
    loading,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
