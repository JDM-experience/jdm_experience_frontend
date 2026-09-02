// Calls the real Node.js backend directly — see adminUserService.ts for why this bypasses the
// mock facade convention. There is no dedicated DELETE /customers endpoint: deactivating a
// customer reuses DELETE /users/:id (SUPER_ADMIN-only soft deactivate, same as the Users page) --
// see deactivateCustomer below.
import { httpClient } from './httpClient';
import { ApiError } from '@/types/api';
import type { Customer, UpdateCustomerProfileInput } from '@/types/customer';

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export async function getCustomers(): Promise<Customer[]> {
  const res = await httpClient.get<ApiEnvelope<Customer[]>>('/customers');
  return res.data;
}

export async function getCustomerById(userId: number): Promise<Customer | null> {
  try {
    const res = await httpClient.get<ApiEnvelope<Customer>>(`/customers/${userId}`);
    return res.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function updateCustomerProfile(userId: number, input: UpdateCustomerProfileInput): Promise<Customer> {
  const res = await httpClient.put<ApiEnvelope<Customer>>(`/customers/${userId}`, input);
  return res.data;
}

/** Soft-deactivate (sets isActive=false) — there is no hard delete; a customer's bookings and
 *  audit history reference their account. SUPER_ADMIN only, and a user cannot deactivate
 *  themselves (both enforced server-side on DELETE /users/:id). */
export async function deactivateCustomer(userId: number): Promise<void> {
  await httpClient.delete<ApiEnvelope<null>>(`/users/${userId}`);
}
