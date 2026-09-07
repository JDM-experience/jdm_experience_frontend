import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { message } from 'antd';
import { useAuth } from '@/contexts/AuthContext';
import {
  getMyNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/services/notificationService';
import { getErrorMessage } from '@/utils/errors';
import type { AppNotification } from '@/types/notification';

const POLL_INTERVAL_MS = 30_000;

interface NotificationContextValue {
  items: AppNotification[];
  unreadCount: number;
  loading: boolean;
  /** Fetches the full recent list -- called when the bell dropdown opens, not on every poll tick
   *  (the interval only re-checks the unread count, per the "don't re-fetch the whole list
   *  unnecessarily" performance requirement). */
  refreshList: () => void;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

/**
 * This backend is a Vercel serverless function with no persistent-connection infrastructure
 * (no WebSocket/SSE), so "live" here means short-interval polling of the lightweight
 * unread-count endpoint rather than a genuine push channel -- the honest, low-complexity fit for
 * this deployment rather than infrastructure it can't actually support. The interval is cleared
 * on logout and on unmount (the "connections cleaned up" requirement, translated to this model).
 */
export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isInitializing } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshList = useCallback(() => {
    setLoading(true);
    getMyNotifications()
      .then((result) => setItems(result.items))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (isInitializing) return;
    if (!isAuthenticated) {
      setItems([]);
      setUnreadCount(0);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const poll = () => {
      getUnreadNotificationCount()
        .then(setUnreadCount)
        .catch(() => undefined);
    };
    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isAuthenticated, isInitializing]);

  const markAsRead = useCallback(async (id: number) => {
    try {
      await markNotificationRead(id);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to update this notification.'));
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await markAllNotificationsRead();
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to update your notifications.'));
    }
  }, []);

  const value = useMemo<NotificationContextValue>(
    () => ({ items, unreadCount, loading, refreshList, markAsRead, markAllAsRead }),
    [items, unreadCount, loading, refreshList, markAsRead, markAllAsRead],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider.');
  return context;
}
