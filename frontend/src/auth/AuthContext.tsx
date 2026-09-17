import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Identity } from '../api/types';

const STORAGE_KEY = 'pulse-survey-identity';

interface AuthContextValue {
  identity: Identity | null;
  login: (identity: Identity) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredIdentity(): Identity | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Identity) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [identity, setIdentity] = useState<Identity | null>(readStoredIdentity);

  const login = useCallback((nextIdentity: Identity) => {
    setIdentity(nextIdentity);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextIdentity));
    } catch {
      // Local-dev convenience only; ignore storage failures (e.g. private browsing).
    }
  }, []);

  const logout = useCallback(() => {
    setIdentity(null);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // See login(): storage is a convenience, not a requirement.
    }
  }, []);

  const value = useMemo(() => ({ identity, login, logout }), [identity, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
