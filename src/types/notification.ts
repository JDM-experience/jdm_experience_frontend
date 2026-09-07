export type NotificationType =
  | 'BOOKING_CONFIRMED'
  | 'PAYMENT_CONFIRMED'
  | 'PAYMENT_REJECTED'
  | 'CANCELLATION_REQUEST_APPROVED'
  | 'CANCELLATION_REQUEST_REJECTED'
  | 'REFUND_COMPLETED'
  | 'TOUR_UPDATED'
  | 'SYSTEM';

export interface AppNotification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityType: string | null;
  relatedEntityId: number | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface PaginatedNotifications {
  items: AppNotification[];
  total: number;
  page: number;
  pageSize: number;
}
