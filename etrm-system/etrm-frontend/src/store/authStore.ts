import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface AuthUser {
  userId: number;
  username: string;
  fullName: string;
  /** Holds the fixed system ADMIN role — lets the frontend show admin-only
   *  overrides (e.g. the ADMIN bypass on V157-locked Static Data tables)
   *  without a second round-trip. The real gate is still server-side
   *  (ReferenceDataController checks ROLE_ADMIN itself); this only decides
   *  whether to show the button. */
  isSystemAdmin: boolean;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  /** Idle-session timeout in seconds, from the login response (server-configured, default 120). */
  sessionTimeoutSeconds: number;
  setAuth: (token: string, user: AuthUser, sessionTimeoutSeconds: number) => void;
  clearAuth: () => void;
}

/**
 * Auth state persisted to sessionStorage — matches exactly where the
 * existing Axios request interceptor already reads the token from
 * (sessionStorage.getItem('etrm_token')). Using sessionStorage rather than
 * localStorage means the session is scoped to the browser tab, which is
 * appropriate for a financial application where "close the tab = log out"
 * is the right default behavior.
 *
 * The Zustand persist middleware keeps the token and user in sync, so
 * refreshing the page doesn't force a re-login as long as the JWT hasn't
 * expired.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      sessionTimeoutSeconds: 120,

      setAuth: (token, user, sessionTimeoutSeconds) => {
        // Keep sessionStorage.etrm_token in sync so the existing Axios
        // interceptor picks it up without any changes to api.ts
        sessionStorage.setItem('etrm_token', token);
        set({ token, user, isAuthenticated: true, sessionTimeoutSeconds });
      },

      clearAuth: () => {
        sessionStorage.removeItem('etrm_token');
        set({ token: null, user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'etrm-auth',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
