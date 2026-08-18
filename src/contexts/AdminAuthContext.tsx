import { createContext, useCallback, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useAuthenticatedUser } from '@/hooks/useAuthenticatedUser';
import type { AdminUser } from '@/types/admin';

interface AdminAuthContextValue {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  /** `returnTo` defaults to `/admin/dashboard` — the fixed post-login landing page for the
   *  admin panel, since AdminLogin has no `?redirect=` deep-link fallback to honor. */
  login: (returnTo?: string) => void;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const { loginWithRedirect, logout: auth0Logout, isAuthenticated: auth0Authenticated } = useAuth0();
  const { profile, isLoading } = useAuthenticatedUser();

  const login = useCallback(
    (returnTo: string = '/admin/dashboard') => {
      loginWithRedirect({ appState: { returnTo } }).catch((error: unknown) => {
        console.error('[Auth0] loginWithRedirect failed:', error);
      });
    },
    [loginWithRedirect],
  );

  const logout = useCallback(() => {
    auth0Logout({ logoutParams: { returnTo: window.location.origin } }).catch((error: unknown) => {
      console.error('[Auth0] logout failed:', error);
    });
  }, [auth0Logout]);

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      admin: profile,
      isAuthenticated: auth0Authenticated && profile !== null,
      isInitializing: isLoading,
      login,
      logout,
    }),
    [profile, auth0Authenticated, isLoading, login, logout],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth(): AdminAuthContextValue {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error('useAdminAuth must be used within an AdminAuthProvider.');
  return context;
}
