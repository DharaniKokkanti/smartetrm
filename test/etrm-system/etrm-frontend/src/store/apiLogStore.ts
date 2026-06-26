import { create } from 'zustand';

export interface ApiLogEntry {
  id: string;
  method: string;
  url: string;
  status: number | null;
  durationMs: number | null;
  requestBody: unknown;
  responseBody: unknown;
  error: string | null;
  startedAt: string; // ISO timestamp
}

interface ApiLogState {
  entries: ApiLogEntry[];
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  addEntry: (entry: ApiLogEntry) => void;
  clear: () => void;
}

const MAX_ENTRIES = 100;

/**
 * Powers the API Activity Log panel — every request/response made through
 * services/api.ts lands here via Axios interceptors, so this captures the
 * real network traffic, not a simulated log. Capped at 100 entries (oldest
 * dropped) so a long session doesn't grow this unbounded in memory.
 */
export const useApiLogStore = create<ApiLogState>((set) => ({
  entries: [],
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  addEntry: (entry) => set((s) => ({ entries: [entry, ...s.entries].slice(0, MAX_ENTRIES) })),
  clear: () => set({ entries: [] }),
}));
