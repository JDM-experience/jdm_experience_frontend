import type { MockUserRecord } from './db';
import type { User } from '@/types/user';

/** Simulates network latency so loading states are exercised during development. */
export function delay(ms = 400): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// This mock db predates Auth0 and only ever modeled shop customers, so the fields the real
// `users` table gained for auth (role/username/authProvider/isActive) aren't tracked here —
// every mock record is a plain customer.
export function toPublicUser(record: MockUserRecord): User {
  return {
    id: record.id,
    fullName: record.fullName,
    email: record.email,
    username: null,
    role: 'CUSTOMER',
    authProvider: 'LOCAL',
    isActive: true,
    createdAt: record.createdAt,
  };
}

/** The mock orders table this used to check against was removed along with the legacy Cart/
 *  Checkout system -- real bookings now live in the actual backend, which this mock product
 *  catalog (see productService.ts, only still used by the Weather page) never tracked anyway. */
export function isProductBookedOnDate(_productId: number, _date: string): boolean {
  return false;
}
