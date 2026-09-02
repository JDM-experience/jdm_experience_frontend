// Calls the real Node.js backend directly — see adminUserService.ts for why this bypasses the
// mock facade convention. Contact messages must be shared across every device/browser (a
// customer submits from one device, staff read it from another) — localStorage-backed mock data
// never leaves the browser it was created in, so there is no meaningful mock fallback here.
import { httpClient } from './httpClient';
import type { ContactMessage, ContactMessageStatus, CreateContactMessageInput } from '@/types/contactMessage';

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export async function createMessage(input: CreateContactMessageInput): Promise<ContactMessage> {
  const res = await httpClient.post<ApiEnvelope<ContactMessage>>('/contact', input);
  return res.data;
}

export async function getMessages(): Promise<ContactMessage[]> {
  const res = await httpClient.get<ApiEnvelope<ContactMessage[]>>('/contact');
  return res.data;
}

export async function updateMessageStatus(id: number, status: ContactMessageStatus): Promise<ContactMessage> {
  const res = await httpClient.put<ApiEnvelope<ContactMessage>>(`/contact/${id}`, { status });
  return res.data;
}

export async function deleteMessage(id: number): Promise<void> {
  await httpClient.delete<ApiEnvelope<null>>(`/contact/${id}`);
}
