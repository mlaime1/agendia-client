import { Session } from '@supabase/supabase-js';
import React, { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { getCurrentUserProfile } from '../lib/api';
import { api } from '../services/backendApi';
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
  registerWithCode: (input: { email: string; password: string; name: string; invitation_code: string; phone?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : 'Ocurrio un error inesperado');
const normalizeRole = (role: unknown): 'driver' | 'admin' | 'client' => {
  const normalizedRole = String(role ?? '').trim().toLowerCase();

  if (normalizedRole === 'admin') {
    return 'admin';
  }

  if (normalizedRole === 'client') {
    return 'client';
  }

  return 'driver';
};

export function AuthProvider({ children }: PropsWithChildren) {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const loadProfile = useCallback(async (currentSession: Session | null) => {
    if (!currentSession?.user?.id) {
      setUserProfile(null);
      setProfileError(null);
      return;
    }

    try {
      setProfileError(null);
      const supabaseUser = currentSession.user;
      let profile: UserProfile;

      try {
        const backendProfile = await getCurrentUserProfile(currentSession.access_token);
        profile = {
          ...backendProfile,
          role: normalizeRole(backendProfile.role),
        };

        console.log('[AuthContext] profile loaded from backend:', {
          id: profile.id,
          email: profile.email,
          roleRaw: backendProfile.role,
          roleNormalized: profile.role,
        });
      } catch (backendError) {
        profile = {
          id: supabaseUser.id,
          name: supabaseUser.user_metadata?.name || supabaseUser.email || 'Usuario',
          email: supabaseUser.email || '',
          alias: supabaseUser.user_metadata?.alias || null,
          role: normalizeRole(supabaseUser.user_metadata?.role),
        };

        console.log('[AuthContext] profile loaded from supabase fallback:', {
          id: profile.id,
          email: profile.email,
          backendError: backendError instanceof Error ? backendError.message : String(backendError),
          roleRaw: supabaseUser.user_metadata?.role,
          roleNormalized: profile.role,
        });
      }

      setUserProfile(profile);
    } catch (error) {
      console.error('[AuthContext] Failed to load profile:', error);
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

      console.log('[AuthContext] login response:', {
        userId: data.session?.user?.id,
        email: data.session?.user?.email,
        roleRaw: data.session?.user?.user_metadata?.role,
        roleNormalized: normalizeRole(data.session?.user?.user_metadata?.role),
      });

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

  const registerWithCode = useCallback(
    async ({ email, name, password, invitation_code, phone }: { email: string; password: string; name: string; invitation_code: string; phone?: string }) => {
      const body: Record<string, string> = {
        email: email.trim(),
        password,
        name: name.trim(),
        invitation_code,
      };

      if (phone) {
        body.phone = phone.trim();
      }

      const response = await api.post<{ session: Session; user: Record<string, unknown> }>('/auth/register', body);

      if (!response.session) {
        throw new Error('No se pudo iniciar sesion despues del registro.');
      }

      setSession(response.session);
      await loadProfile(response.session);
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
      registerWithCode,
      logout,
      refreshProfile,
    }),
    [isLoading, login, logout, profileError, refreshProfile, register, registerWithCode, session, userProfile],
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
