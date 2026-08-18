'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { apiFetch, refreshSession, setAccessToken } from '@/lib/api';
import type { AuthUser, SessionResponse } from '@/lib/types';

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: {
    name: string;
    email: string;
    password: string;
    inviteToken?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const restored = await refreshSession();
      if (restored) {
        try {
          const me = await apiFetch<AuthUser>('/auth/me');
          setUser(me);
        } catch {
          setAccessToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    })();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      async login(email, password) {
        const session = await apiFetch<SessionResponse>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        setAccessToken(session.accessToken);
        setUser(session.user);
      },
      async register(input) {
        const session = await apiFetch<SessionResponse>('/auth/register', {
          method: 'POST',
          body: JSON.stringify(input),
        });
        setAccessToken(session.accessToken);
        setUser(session.user);
      },
      async logout() {
        await apiFetch('/auth/logout', { method: 'POST' });
        setAccessToken(null);
        setUser(null);
      },
      async refreshUser() {
        const me = await apiFetch<AuthUser>('/auth/me');
        setUser(me);
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}
