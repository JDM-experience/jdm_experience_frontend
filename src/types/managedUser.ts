import type { AdminUser, UserRole } from '@/types/admin';

/** A user as managed from the admin Users page. Same shape as `AdminUser` (the real backend's
 *  `PublicUser`) — kept as a distinct alias since this list can include any role. */
export type ManagedUser = AdminUser;

export interface CreateManagedUserInput {
  fullName: string;
  email: string;
  role: UserRole;
}

export interface UpdateManagedUserInput {
  fullName?: string;
  email?: string;
  role?: UserRole;
  isActive?: boolean;
}
