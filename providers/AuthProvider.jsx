'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { USER_ROLES } from '@/constants/config';

const AuthContext = createContext({
  user:            null,
  profile:         null,
  isAdmin:         false,
  loading:         true,
  signOut:         async () => {},
  refreshProfile:  async () => {},
});

export const AuthProvider = ({ children }) => {
  const queryClient = useQueryClient();
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const res  = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        setProfile(data.user);  // profile === user object in the new system
      } else {
        setUser(null);
        setProfile(null);
      }
    } catch {
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  const signOut = async () => {
    queryClient.clear();
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => { await fetchMe(); };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      isAdmin: profile?.role === USER_ROLES.ADMIN,
      loading,
      signOut,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
