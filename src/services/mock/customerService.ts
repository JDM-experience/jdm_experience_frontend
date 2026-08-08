import { getDb, saveDb } from './db';
import { delay, toPublicUser } from './helpers';
import { ApiError } from '@/types/api';
import type { User } from '@/types/user';

export async function getCustomers(): Promise<User[]> {
  await delay();
  return [...getDb().users].sort((a, b) => b.id - a.id).map(toPublicUser);
}

export async function getCustomerById(id: number): Promise<User | null> {
  await delay();
  const record = getDb().users.find((u) => u.id === id);
  return record ? toPublicUser(record) : null;
}

export async function deleteCustomer(id: number): Promise<void> {
  await delay();
  const db = getDb();
  const index = db.users.findIndex((u) => u.id === id);
  if (index === -1) throw new ApiError('Customer not found or already deleted.', 404);
  db.users.splice(index, 1);
  saveDb();
}
