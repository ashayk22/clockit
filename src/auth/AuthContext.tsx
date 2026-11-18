import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  AuthUser,
  enterDemo as storeEnterDemo,
  getSession,
  isCloudAuth,
  restoreSession,
  signIn as storeSignIn,
  signOut as storeSignOut,
  signUp as storeSignUp,
  updateProfile as storeUpdateProfile,
  requestPasswordReset as storeRequestPasswordReset,
  updatePassword as storeUpdatePassword,
  changePassword as storeChangePassword,
  subscribeToAuthChanges,
} from './authStore';
import { requestLoginTransition } from './loginTransition';
import { startCloudSync, stopCloudSync } from '../services/cloud';
import { loadDemoData } from '../demo/demoService';
import { noteRepository, setRepositoryOwner } from '../services/repositories';
import { getStorageOwner } from '../services/repositories/storage';

const storageOwnerFor = (next: AuthUser | null): string =>
  !next ? 'local' : next.isDemo ? 'demo' : `user:${next.id}`;

function activateOwner(next: AuthUser | null): void {
  if (getStorageOwner() !== storageOwnerFor(next)) stopCloudSync();
  setRepositoryOwner(storageOwnerFor(next));
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isDemo: boolean;
  /** True while the session is being restored from the backend on boot. */
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  signUp: (name: string, email: string, password: string) => Promise<AuthUser>;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  updateProfile: (name: string) => Promise<AuthUser>;
  enterDemo: () => Promise<AuthUser>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const restored = getSession();
    setRepositoryOwner(storageOwnerFor(restored));
    return restored;
  });
  // With a backend the session has to be validated before we can trust it, so
  // boot waits. Without one the cached session is authoritative and the app
  // renders immediately — exactly the behaviour it had before Phase 12.
  const [isLoading, setIsLoading] = useState<boolean>(() => isCloudAuth);

  useEffect(() => {
    let active = true;
    const unsubscribe = subscribeToAuthChanges((next) => {
      if (active) {
        activateOwner(next);
        setUser(next);
      }
    });

    (async () => {
      try {
        const restored = await restoreSession();
        if (active) {
          activateOwner(restored);
          setUser(restored);
        }
      } catch (error) {
        console.error('[clockit/auth] Could not restore the session', error);
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  // Cloud sync follows the signed-in user; it is a no-op without credentials or for demo mode.
  useEffect(() => {
    if (user?.id && !user.isDemo) {
      void startCloudSync(user.id);
    } else {
      stopCloudSync();
    }
  }, [user?.id, user?.isDemo]);

  const enterDemo = useCallback(async () => {
    const next = await storeEnterDemo();
    activateOwner(next);
    await noteRepository.init();
    loadDemoData();
    requestLoginTransition();
    setUser(next);
    return next;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const next = await storeSignIn(email, password);
    activateOwner(next);
    if (next.isDemo) {
      await noteRepository.init();
      loadDemoData();
    }
    requestLoginTransition();
    setUser(next);
    return next;
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    const next = await storeSignUp(name, email, password);
    activateOwner(next);
    requestLoginTransition();
    setUser(next);
    return next;
  }, []);

  const updateProfile = useCallback(async (newName: string) => {
    const updated = await storeUpdateProfile(newName);
    setUser(updated);
    return updated;
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    await storeRequestPasswordReset(email);
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    await storeUpdatePassword(newPassword);
  }, []);

  const changePassword = useCallback(async (oldPassword: string, newPassword: string) => {
    await storeChangePassword(oldPassword, newPassword);
  }, []);

  const signOut = useCallback(async () => {
    stopCloudSync();
    await storeSignOut();
    activateOwner(null);
    setUser(null);
  }, []);

  const isDemo = Boolean(user?.isDemo);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isDemo,
      isLoading,
      signIn,
      signUp,
      requestPasswordReset,
      updatePassword,
      changePassword,
      updateProfile,
      enterDemo,
      signOut,
    }),
    [
      user,
      isDemo,
      isLoading,
      signIn,
      signUp,
      requestPasswordReset,
      updatePassword,
      changePassword,
      updateProfile,
      enterDemo,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside an AuthProvider');
  return ctx;
}
