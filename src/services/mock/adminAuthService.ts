import { getDb } from './db';
import { delay } from './helpers';
import { ApiError } from '@/types/api';
import type { AdminLoginInput, AdminUser } from '@/types/admin';

export async function adminLogin(input: AdminLoginInput): Promise<AdminUser> {
  await delay();
  const record = getDb().admins.find((a) => a.username === input.username.trim());
  if (!record || record.password !== input.password) {
    throw new ApiError('Invalid username or password.', 401);
  }
  return { username: record.username };
}
