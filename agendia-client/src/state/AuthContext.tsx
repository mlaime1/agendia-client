import { Session } from '@supabase/supabase-js';
import React, { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { getCurrentUserProfile } from '../lib/api';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../features/auth/types/user';

type AuthContextValue = {
  isLoading: boolean;
  isAuthenticated: boolean;
  session: Session | null;
  userProfile: UserProfile | null;
  profileError: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { email: string; password: string; name: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : 'Ocurrio un error inesperado');

export function AuthProvider({ children }: PropsWithChildren) {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const loadProfile = useCallback(async (currentSession: Session | null) => {
    if (!currentSession?.access_token) {
      setUserProfile(null);
      setProfileError(null);
      return;
    }

    try {
      setProfileError(null);
      const profile = await getCurrentUserProfile(currentSession.access_token);
      setUserProfile(profile);
    } catch (error) {
      setUserProfile(null);
      setProfileError(getErrorMessage(error));
    }
  }, []);

  const restoreSession = useCallback(async () => {
    setIsLoading(true);

    const { data, error } = await supabase.auth.getSession();

    if (error) {
      setSession(null);
      setUserProfile(null);
      setProfileError(error.message);
      setIsLoading(false);
      return;
    }

    setSession(data.session);
    await loadProfile(data.session);
    setIsLoading(false);
  }, [loadProfile]);

  useEffect(() => {
    void restoreSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      void loadProfile(nextSession);
    });

    return () => subscription.unsubscribe();
  }, [loadProfile, restoreSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw error;
      }

      setSession(data.session);
      await loadProfile(data.session);
    },
    [loadProfile],
  );

  const register = useCallback(
    async ({ email, name, password }: { email: string; password: string; name: string }) => {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            name: name.trim(),
          },
        },
      });

      if (error) {
        throw error;
      }

      if (!data.session) {
        throw new Error('Registro creado. Revisa tu email para confirmar la cuenta antes de iniciar sesion.');
      }

      setSession(data.session);
      await loadProfile(data.session);
    },
    [loadProfile],
  );

  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    setSession(null);
    setUserProfile(null);
    setProfileError(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    await loadProfile(session);
  }, [loadProfile, session]);

  const value = useMemo(
    () => ({
      isLoading,
      isAuthenticated: Boolean(session),
      session,
      userProfile,
      profileError,
      login,
      register,
      logout,
      refreshProfile,
    }),
    [isLoading, login, logout, profileError, refreshProfile, register, session, userProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
