import { create } from 'zustand';

interface UiState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

/**
 * Pure UI/shell state lives in Zustand — sidebar collapse, active filters,
 * anything ephemeral and client-only. Server data (entities, reference
 * tables, trades) always goes through React Query instead, never Zustand —
 * keeping that line firm avoids the classic "two sources of truth fighting
 * each other" bug as more screens get added.
 */
export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
}));
