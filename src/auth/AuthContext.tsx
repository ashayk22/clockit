import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  AuthUser,
  getSession,
  signIn as storeSignIn,
  signOut as storeSignOut,
  signUp as storeSignUp,
} from './authStore';
import { requestLoginTransition } from './loginTransition';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  /** Simulated network latency so loading states are real, not decorative. */
  signIn: (email: string, password: string) => Promise<AuthUser>;
  signUp: (name: string, email: string, password: string) => Promise<AuthUser>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const AUTH_LATENCY_MS = 650;

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => getSession());

  // Keep multiple tabs consistent.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'clockit-auth-session') setUser(getSession());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    await wait(AUTH_LATENCY_MS);
    const next = storeSignIn(email, password);
    // Only reached on success — the store throws on bad credentials.
    requestLoginTransition();
    setUser(next);
    return next;
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    await wait(AUTH_LATENCY_MS);
    const next = storeSignUp(name, email, password);
    requestLoginTransition();
    setUser(next);
    return next;
  }, []);

  const signOut = useCallback(() => {
    storeSignOut();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: user !== null, signIn, signUp, signOut }),
    [user, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside an AuthProvider');
  return ctx;
}
