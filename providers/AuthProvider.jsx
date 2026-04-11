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
    // onAuthStateChange fires INITIAL_SESSION immediately on mount with the
    // persisted session (read from cookies/localStorage — no network call).
    // Subsequent events (TOKEN_REFRESHED, SIGNED_IN, SIGNED_OUT) keep state
    // in sync. This single listener replaces the old initAuth + getUser()
    // pattern that caused a race: getUser() triggered a server round-trip
    // that could time out and sign the user out while INITIAL_SESSION had
    // already resolved the session successfully.
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
