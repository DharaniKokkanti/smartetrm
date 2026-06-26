import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ThemeMode } from '@theme/tokens';

export type { ThemeMode };

interface ThemeState {
  mode: ThemeMode;
  toggle: () => void;
  setMode: (mode: ThemeMode) => void;
}

/**
 * Persisted to localStorage (not sessionStorage) — theme preference should
 * survive closing the browser, unlike auth tokens or session-only state.
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'light',
      toggle: () => set((s) => ({ mode: s.mode === 'light' ? 'dark' : 'light' })),
      setMode: (mode) => set({ mode }),
    }),
    { name: 'etrm-theme' },
  ),
);
