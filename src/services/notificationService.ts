// Live website notifications -- the caller is always determined server-side from the Auth0
// token, same convention as wishlistService.ts.
import { httpClient } from './httpClient';
import type { ApiEnvelope } from '@/types/api';
import type { AppNotification, PaginatedNotifications } from '@/types/notification';

export async function getMyNotifications(page = 1, pageSize = 20): Promise<PaginatedNotifications> {
  const res = await httpClient.get<ApiEnvelope<PaginatedNotifications>>(`/notifications?page=${page}&pageSize=${pageSize}`);
  return res.data;
}

/** Polled on an interval to power the navbar badge -- never fetches the full list just for a
 *  count. */
export async function getUnreadNotificationCount(): Promise<number> {
  const res = await httpClient.get<ApiEnvelope<{ count: number }>>('/notifications/unread-count');
  return res.data.count;
}

export async function markNotificationRead(id: number): Promise<AppNotification> {
  const res = await httpClient.patch<ApiEnvelope<AppNotification>>(`/notifications/${id}/read`, undefined);
  return res.data;
}

export async function markAllNotificationsRead(): Promise<void> {
  await httpClient.patch<ApiEnvelope<null>>('/notifications/read-all', undefined);
}
