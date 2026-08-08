import { getDb, saveDb } from './db';
import { delay, toPublicUser } from './helpers';
import { ApiError } from '@/types/api';
import type { ChangePasswordInput, LoginInput, RegisterInput, UpdateProfileInput, User } from '@/types/user';

export async function login(input: LoginInput): Promise<User> {
  await delay();
  const record = getDb().users.find((u) => u.email.toLowerCase() === input.email.trim().toLowerCase());
  if (!record) {
    throw new ApiError('No account found with that email.', 404);
  }
  if (record.password !== input.password) {
    throw new ApiError('Invalid password. Please try again.', 401);
  }
  return toPublicUser(record);
}

export async function register(input: RegisterInput): Promise<User> {
  await delay();
  if (input.password !== input.confirmPassword) {
    throw new ApiError('Passwords do not match.', 400);
  }
  const db = getDb();
  const exists = db.users.some((u) => u.email.toLowerCase() === input.email.trim().toLowerCase());
  if (exists) {
    throw new ApiError('Email is already registered.', 409);
  }
  const record = {
    id: db.nextIds.user,
    fullName: input.fullName.trim(),
    email: input.email.trim(),
    password: input.password,
    createdAt: new Date().toISOString(),
  };
  db.users.push(record);
  db.nextIds.user += 1;
  saveDb();
  return toPublicUser(record);
}

export async function updateProfile(userId: number, input: UpdateProfileInput): Promise<User> {
  await delay();
  const db = getDb();
  const record = db.users.find((u) => u.id === userId);
  if (!record) throw new ApiError('Account not found.', 404);
  record.fullName = input.fullName.trim();
  record.email = input.email.trim();
  saveDb();
  return toPublicUser(record);
}

export async function changePassword(userId: number, input: ChangePasswordInput): Promise<void> {
  await delay();
  const db = getDb();
  const record = db.users.find((u) => u.id === userId);
  if (!record) throw new ApiError('Account not found.', 404);
  if (record.password !== input.currentPassword) {
    throw new ApiError('Current password is incorrect.', 401);
  }
  if (input.newPassword.length < 6) {
    throw new ApiError('New password must be at least 6 characters long.', 400);
  }
  if (input.newPassword !== input.confirmPassword) {
    throw new ApiError('New passwords do not match.', 400);
  }
  record.password = input.newPassword;
  saveDb();
}
