// Calls the real Node.js backend directly — deliberately NOT routed through the
// services/mock/* facade convention used elsewhere in this app. Super Admin user management
// inherently needs the live database (creating a real login-capable account); there's no
// meaningful mock to fall back to, and USE_MOCKS doesn't apply here.
import { httpClient } from './httpClient';
import type { CreateManagedUserInput, ManagedUser, UpdateManagedUserInput } from '@/types/managedUser';

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export async function listUsers(): Promise<ManagedUser[]> {
  const res = await httpClient.get<ApiEnvelope<ManagedUser[]>>('/users');
  return res.data;
}

export async function createUser(input: CreateManagedUserInput): Promise<ManagedUser> {
  const res = await httpClient.post<ApiEnvelope<ManagedUser>>('/users', input);
  return res.data;
}

export async function updateUser(id: number, input: UpdateManagedUserInput): Promise<ManagedUser> {
  const res = await httpClient.put<ApiEnvelope<ManagedUser>>(`/users/${id}`, input);
  return res.data;
}

export async function deactivateUser(id: number): Promise<void> {
  await httpClient.delete<ApiEnvelope<null>>(`/users/${id}`);
}
