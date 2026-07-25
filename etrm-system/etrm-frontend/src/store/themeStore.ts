import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ThemeMode } from '@theme/tokens';

export type { ThemeMode };

interface ThemeState {
  mode: ThemeMode;
  toggle: () => void;
  setMode: (mode: ThemeMode) => void;
  /**
   * Global accessibility/preference toggle, independent of light/dark.
   * Implemented as a CSS grayscale filter on the document root (see
   * index.css's `html.theme-mono` rule + AppProviders' effect that sets
   * it) rather than swapping palette tokens — most components still
   * import the raw `color` object from tokens.ts directly instead of
   * going through `paletteFor(mode)`, so a token-level mono palette
   * would miss most of the app. A root-level filter guarantees every
   * page (and every antd portal — Modal/Notification/Dropdown all mount
   * under <body>, itself under <html>) actually goes grayscale,
   * including status colors (success/error/warning), per explicit
   * request that this be a fully-grayscale mode, not just accents.
   */
  monochrome: boolean;
  toggleMonochrome: () => void;
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
      monochrome: false,
      toggleMonochrome: () => set((s) => ({ monochrome: !s.monochrome })),
    }),
    { name: 'etrm-theme' },
  ),
);
