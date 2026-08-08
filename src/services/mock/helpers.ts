import { getDb } from './db';
import type { MockUserRecord } from './db';
import type { User } from '@/types/user';

/** Simulates network latency so loading states are exercised during development. */
export function delay(ms = 400): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function toPublicUser(record: MockUserRecord): User {
  return {
    id: record.id,
    fullName: record.fullName,
    email: record.email,
    createdAt: record.createdAt,
  };
}

/** Mirrors car_helpers.php::car_has_booking_for_date() against the mock orders table. */
export function isProductBookedOnDate(productId: number, date: string): boolean {
  const { orders } = getDb();
  return orders.some(
    (order) =>
      order.status !== 'Cancelled' &&
      order.items.some((item) => item.productId === productId && item.date === date),
  );
}
