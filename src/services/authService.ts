// Self-service "my profile" calls -- distinct from adminUserService.ts's SUPER_ADMIN-only
// user management, and from customerService.ts's staff-facing customer travel-profile edits.
import { httpClient } from './httpClient';
import type { ApiEnvelope } from '@/types/api';
import type { UpdateOwnProfileInput, User } from '@/types/user';

/** Backend re-verifies the caller from the Auth0 token -- only fullName/phone are ever accepted,
 *  regardless of what's sent here (role/email/isActive can never reach this endpoint). */
export async function updateOwnProfile(input: UpdateOwnProfileInput): Promise<User> {
  const res = await httpClient.patch<ApiEnvelope<User>>('/auth/me', input);
  return res.data;
}
