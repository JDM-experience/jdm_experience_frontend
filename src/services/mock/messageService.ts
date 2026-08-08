import { getDb, saveDb } from './db';
import { delay } from './helpers';
import { ApiError } from '@/types/api';
import type { ContactMessage, CreateContactMessageInput, ReplyMessageInput } from '@/types/contactMessage';

export async function getMessages(): Promise<ContactMessage[]> {
  await delay();
  return [...getDb().messages].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function createMessage(input: CreateContactMessageInput): Promise<ContactMessage> {
  await delay();
  const db = getDb();
  const message: ContactMessage = {
    id: db.nextIds.message,
    name: input.name.trim(),
    email: input.email.trim(),
    message: input.message.trim(),
    createdAt: new Date().toISOString(),
  };
  db.messages.unshift(message);
  db.nextIds.message += 1;
  saveDb();
  return message;
}

export async function deleteMessage(id: number): Promise<void> {
  await delay();
  const db = getDb();
  const index = db.messages.findIndex((m) => m.id === id);
  if (index === -1) throw new ApiError('Message not found.', 404);
  db.messages.splice(index, 1);
  saveDb();
}

/**
 * send_reply.php actually sends an email via PHP's mail(). There is no
 * backend here, so this only simulates success — no email is ever sent.
 */
export async function replyToMessage(input: ReplyMessageInput): Promise<void> {
  await delay(500);
  const exists = getDb().messages.some((m) => m.id === input.messageId);
  if (!exists) throw new ApiError('Message not found.', 404);
}
