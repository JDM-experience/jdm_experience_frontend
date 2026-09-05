import { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { httpClient, setAccessTokenGetter } from '@/services/httpClient';
import type { ApiEnvelope } from '@/types/api';
import type { User } from '@/types/user';

/**
 * Bridges the Auth0 session to the local backend's `users` row. Shared by AuthContext and
 * AdminAuthContext — both surfaces read the same Auth0 session and the same `GET /api/auth/me`
 * response, just exposed under different hook names (`user` vs `admin`).
 *
 * Registers `getAccessTokenSilently` with httpClient so every subsequent request (from any
 * service, not just this hook's own fetch) can attach a bearer token.
 */
export function useAuthenticatedUser(): { profile: User | null; isLoading: boolean } {
  const { isAuthenticated, isLoading: auth0Loading, getAccessTokenSilently } = useAuth0();
  const [profile, setProfile] = useState<User | null>(null);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    setAccessTokenGetter(isAuthenticated ? () => getAccessTokenSilently() : null);
  }, [isAuthenticated, getAccessTokenSilently]);

  useEffect(() => {
    if (auth0Loading) return;
    if (!isAuthenticated) {
      setProfile(null);
      return;
    }

    let cancelled = false;
    setFetching(true);
    httpClient
      .get<ApiEnvelope<User>>('/auth/me')
      .then((res) => {
        if (!cancelled) setProfile(res.data);
      })
      .catch(() => {
        if (!cancelled) setProfile(null);
      })
      .finally(() => {
        if (!cancelled) setFetching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, auth0Loading]);

  return { profile, isLoading: auth0Loading || fetching };
}
