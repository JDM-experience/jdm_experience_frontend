export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  message: string;
  createdAt: string;
}

export interface CreateContactMessageInput {
  name: string;
  email: string;
  message: string;
}

export interface ReplyMessageInput {
  messageId: number;
  subject: string;
  body: string;
}
