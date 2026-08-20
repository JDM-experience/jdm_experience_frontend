import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useAuthenticatedUser } from '@/hooks/useAuthenticatedUser';
import type { User } from '@/types/user';

interface LoginOptions {
  /** Where to land after Auth0 redirects back. Defaults to the current path — pass the
   *  `?redirect=` target from ProtectedRoute when logging in from a bounced deep link. */
  returnTo?: string;
  /** Sends the user straight to Auth0 Universal Login's sign-up tab. */
  screenHint?: 'signup';
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (options?: LoginOptions) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { loginWithRedirect, logout: auth0Logout, isAuthenticated: auth0Authenticated, error: auth0Error } = useAuth0();
  const { profile, isLoading } = useAuthenticatedUser();

  // auth0-react doesn't console.error internal failures (bad audience, callback URL mismatch,
  // failed code exchange, etc.) — it just sets this field. Without surfacing it, a failed
  // redirect callback looks identical to "nothing happened."
  useEffect(() => {
    if (auth0Error) console.error('[Auth0] error state:', auth0Error.message, auth0Error);
  }, [auth0Error]);

  const login = useCallback(
    (options?: LoginOptions) => {
      loginWithRedirect({
        appState: { returnTo: options?.returnTo ?? `${window.location.pathname}${window.location.search}` },
        authorizationParams: options?.screenHint ? { screen_hint: options.screenHint } : undefined,
      }).catch((error: unknown) => {
        // loginWithRedirect normally never resolves (the page navigates away first) — a
        // rejection here means it failed before that, e.g. misconfigured domain/clientId.
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

  const value = useMemo<AuthContextValue>(
    () => ({
      user: profile,
      isAuthenticated: auth0Authenticated && profile !== null,
      isInitializing: isLoading,
      login,
      logout,
    }),
    [profile, auth0Authenticated, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider.');
  return context;
}
