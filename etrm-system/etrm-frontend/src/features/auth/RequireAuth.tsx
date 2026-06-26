import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@store/authStore';

interface Props {
  children: ReactNode;
}

/**
 * Wraps any route that requires authentication. When the user hits a
 * protected route without a session, redirects to /login and carries
 * the original path as `state.from` so the login page can send them
 * back there after a successful sign-in.
 *
 * Session restoration from sessionStorage is handled by the auth store's
 * Zustand persist middleware — if the token is still in sessionStorage
 * (i.e. same tab, page refresh), isAuthenticated is already true when this
 * component mounts and nothing redirects.
 */
export function RequireAuth({ children }: Props) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}
