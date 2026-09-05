import { API_URL } from './config';
import { ApiError } from '@/types/api';

type AccessTokenGetter = () => Promise<string>;

let getAccessToken: AccessTokenGetter | null = null;

/** Registered once by the Auth0-backed auth contexts on mount (see
 * hooks/useAuthenticatedUser) so this module can attach a bearer token without importing
 * React/Auth0 itself. Pass `null` to stop attaching a token (e.g. after logout). */
export function setAccessTokenGetter(getter: AccessTokenGetter | null): void {
  getAccessToken = getter;
}

/** Attaches `Authorization: Bearer <token>` whenever a token getter is registered and a token is
 *  actually obtainable — public endpoints keep working with no header, and a failed/expired
 *  session just proceeds unauthenticated so protected endpoints correctly 401 instead of throwing
 *  here. Shared by `request` and `uploadRequest`. */
async function getAuthHeader(): Promise<Record<string, string>> {
  if (!getAccessToken) return {};
  try {
    return { Authorization: `Bearer ${await getAccessToken()}` };
  } catch {
    return {};
  }
}

/** Shared by `request` and `uploadRequest`: turns a non-ok Response into a thrown `ApiError`,
 *  preferring the backend's JSON `message` field over the raw status text when present. */
async function throwForErrorResponse(response: Response): Promise<never> {
  let message = response.statusText;
  try {
    const body = (await response.json()) as { message?: string };
    if (body.message) message = body.message;
  } catch {
    // Response had no JSON body — fall back to statusText.
  }
  throw new ApiError(message, response.status);
}

/**
 * Thin fetch wrapper for the Node.js backend. Every facade in src/services currently
 * re-exports its src/services/mock counterpart; a few (settingsService, adminUserService,
 * the auth contexts) bypass that and call this directly.
 */
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const authHeader = await getAuthHeader();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...authHeader, ...options.headers },
  });

  if (!response.ok) await throwForErrorResponse(response);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

/**
 * Like `request`, but for a multipart/form-data body (file uploads) — deliberately does NOT
 * set Content-Type itself. The browser must set it (as `multipart/form-data; boundary=...`,
 * computed from the actual FormData contents), which is exactly what happens by leaving it
 * unset on a fetch call with a FormData body; setting it manually breaks the upload.
 */
async function uploadRequest<T>(path: string, formData: FormData): Promise<T> {
  const authHeader = await getAuthHeader();
  const response = await fetch(`${API_URL}${path}`, { method: 'POST', headers: authHeader, body: formData });

  if (!response.ok) await throwForErrorResponse(response);
  return (await response.json()) as T;
}

export const httpClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  upload: <T>(path: string, formData: FormData) => uploadRequest<T>(path, formData),
};
