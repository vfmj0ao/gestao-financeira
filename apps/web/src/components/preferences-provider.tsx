'use client';

import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import {
  DEFAULT_PREFS,
  getPreferencesSnapshot,
  savePreferences,
  subscribePreferences,
  type UserPreferences,
} from '@/lib/preferences';

type PreferencesContextValue = {
  prefs: UserPreferences;
  updatePrefs: (next: Partial<UserPreferences>) => void;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const prefs = useSyncExternalStore(
    subscribePreferences,
    getPreferencesSnapshot,
    () => DEFAULT_PREFS,
  );

  const value = useMemo<PreferencesContextValue>(
    () => ({
      prefs,
      updatePrefs(next) {
        savePreferences({ ...getPreferencesSnapshot(), ...next });
      },
    }),
    [prefs],
  );

  return (
    <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences precisa estar dentro de PreferencesProvider');
  }
  return context;
}
