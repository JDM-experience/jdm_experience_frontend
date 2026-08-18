export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'TOUR_GUIDE' | 'CUSTOMER';

/** The authenticated user profile — mirrors the real backend's `PublicUser` shape
 *  (`jdm_experience_backend`'s `src/types/dto.ts`), returned by `GET /api/auth/me`. */
export interface User {
  id: number;
  fullName: string | null;
  email: string;
  username: string | null;
  role: UserRole;
  authProvider: string;
  isActive: boolean;
  createdAt: string;
}
