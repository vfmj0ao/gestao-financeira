'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { apiFetch, refreshSession, setAccessToken } from '@/lib/api';
import type { AuthUser, GroupSummary, SessionResponse } from '@/lib/types';

const ACTIVE_GROUP_KEY = 'gf_active_group_id';

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  activeGroup: GroupSummary | null;
  setActiveGroupId: (groupId: string) => void;
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

function pickGroupId(groups: GroupSummary[], preferred: string | null) {
  if (preferred && groups.some((group) => group.id === preferred)) {
    return preferred;
  }
  return groups[0]?.id ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeGroupId, setActiveGroupIdState] = useState<string | null>(null);

  function applyUser(nextUser: AuthUser | null) {
    setUser(nextUser);
    if (!nextUser) {
      setActiveGroupIdState(null);
      return;
    }
    const stored = window.localStorage.getItem(ACTIVE_GROUP_KEY);
    const selected = pickGroupId(nextUser.groups, stored);
    if (selected) {
      window.localStorage.setItem(ACTIVE_GROUP_KEY, selected);
    }
    setActiveGroupIdState(selected);
  }

  useEffect(() => {
    void (async () => {
      const restored = await refreshSession();
      if (restored) {
        try {
          const me = await apiFetch<AuthUser>('/auth/me');
          applyUser(me);
        } catch {
          setAccessToken(null);
          applyUser(null);
        }
      }
      setLoading(false);
    })();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      activeGroup:
        user?.groups.find((group) => group.id === activeGroupId) ?? user?.groups[0] ?? null,
      setActiveGroupId(groupId: string) {
        window.localStorage.setItem(ACTIVE_GROUP_KEY, groupId);
        setActiveGroupIdState(groupId);
      },
      async login(email, password) {
        const session = await apiFetch<SessionResponse>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        setAccessToken(session.accessToken);
        applyUser(session.user);
      },
      async register(input) {
        const session = await apiFetch<SessionResponse>('/auth/register', {
          method: 'POST',
          body: JSON.stringify(input),
        });
        setAccessToken(session.accessToken);
        applyUser(session.user);
      },
      async logout() {
        await apiFetch('/auth/logout', { method: 'POST' });
        setAccessToken(null);
        applyUser(null);
      },
      async refreshUser() {
        const me = await apiFetch<AuthUser>('/auth/me');
        applyUser(me);
      },
    }),
    [user, loading, activeGroupId],
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
