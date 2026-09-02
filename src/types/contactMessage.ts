export type ContactMessageStatus = 'NEW' | 'READ' | 'REPLIED' | 'ARCHIVED';

export interface ContactMessage {
  id: number;
  name: string | null;
  email: string | null;
  subject: string | null;
  message: string | null;
  status: ContactMessageStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContactMessageInput {
  name: string;
  email: string;
  subject?: string;
  message: string;
}
