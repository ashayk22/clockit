import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { preferencesRepository } from '../services/repositories';
import type { AppearanceMode } from '../services/repositories/types';

export type Theme = 'light' | 'dark';
export type { AppearanceMode };

interface ThemeContextValue {
  theme: Theme;
  appearance: AppearanceMode;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  setAppearance: (appearance: AppearanceMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): Theme {
  if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

function resolveTheme(appearance: AppearanceMode): Theme {
  if (appearance === 'system') {
    return getSystemTheme();
  }
  return appearance;
}

/**
 * The document already carries the correct class thanks to the inline
 * bootstrapping script in index.html, so we read from there first to avoid
 * any flash of the wrong theme. Otherwise fall back to the persisted
 * preference.
 */
function readInitialAppearance(): AppearanceMode {
  return preferencesRepository.get('appearancePreference') || 'system';
}

function readInitialTheme(appearance: AppearanceMode): Theme {
  if (typeof document !== 'undefined') {
    if (document.documentElement.classList.contains('dark')) return 'dark';
  }
  return resolveTheme(appearance);
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appearance, setAppearanceState] = useState<AppearanceMode>(readInitialAppearance);
  const [theme, setThemeState] = useState<Theme>(() => readInitialTheme(appearance));

  // Follow the persisted preference, including cross-tab storage changes
  useEffect(() => {
    return preferencesRepository.subscribe(() => {
      const persistedAppearance = preferencesRepository.get('appearancePreference') || 'system';
      setAppearanceState(persistedAppearance);
      setThemeState(resolveTheme(persistedAppearance));
    });
  }, []);

  // Listen to live OS system theme preference changes when mode is 'system'
  useEffect(() => {
    if (appearance !== 'system' || typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => {
      const newTheme: Theme = e.matches ? 'dark' : 'light';
      setThemeState(newTheme);
    };
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [appearance]);

  // Apply resolved theme class and color scheme to document element
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;

    if (preferencesRepository.get('theme') !== theme) {
      preferencesRepository.set('theme', theme);
    }
  }, [theme]);

  const setAppearance = useCallback((next: AppearanceMode) => {
    setAppearanceState(next);
    preferencesRepository.set('appearancePreference', next);
    const resolved = resolveTheme(next);
    setThemeState(resolved);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setAppearance(next);
  }, [setAppearance]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      preferencesRepository.set('appearancePreference', next);
      setAppearanceState(next);
      return next;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      appearance,
      isDark: theme === 'dark',
      setTheme,
      setAppearance,
      toggleTheme,
    }),
    [theme, appearance, setTheme, setAppearance, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside a ThemeProvider');
  return ctx;
}
