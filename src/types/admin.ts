import type { User } from './user';

export type { UserRole } from './user';

/** The authenticated admin-panel user — the same Auth0 session and the same backend `users` row
 *  as the customer-facing `User` (see `AdminAuthContext`), just exposed under a distinct name for
 *  the admin panel's own components. */
export type AdminUser = User;
