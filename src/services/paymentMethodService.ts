// Calls the real Node.js backend directly, same convention as adminUserService.ts.
import { httpClient } from './httpClient';
import type { CreatePaymentMethodInput, PaymentMethod, UpdatePaymentMethodInput } from '@/types/paymentMethod';

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

/** Any authenticated user -- a CUSTOMER gets active-only, staff get everything (see backend). */
export async function listPaymentMethods(): Promise<PaymentMethod[]> {
  const res = await httpClient.get<ApiEnvelope<PaymentMethod[]>>('/payment-methods');
  return res.data;
}

export async function createPaymentMethod(input: CreatePaymentMethodInput): Promise<PaymentMethod> {
  const res = await httpClient.post<ApiEnvelope<PaymentMethod>>('/payment-methods', input);
  return res.data;
}

export async function updatePaymentMethod(id: number, input: UpdatePaymentMethodInput): Promise<PaymentMethod> {
  const res = await httpClient.put<ApiEnvelope<PaymentMethod>>(`/payment-methods/${id}`, input);
  return res.data;
}

export async function deletePaymentMethod(id: number): Promise<void> {
  await httpClient.delete<ApiEnvelope<null>>(`/payment-methods/${id}`);
}
