import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface AuthUser {
  userId: number;
  username: string;
  fullName: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: AuthUser) => void;
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

      setAuth: (token, user) => {
        // Keep sessionStorage.etrm_token in sync so the existing Axios
        // interceptor picks it up without any changes to api.ts
        sessionStorage.setItem('etrm_token', token);
        set({ token, user, isAuthenticated: true });
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
