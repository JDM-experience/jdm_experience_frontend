import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { message, notification } from 'antd';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // The highest notification id already surfaced as a toast (or seen at all) -- starts null so
  // the very first poll on page load never toasts the customer's entire pre-existing backlog,
  // only notifications that arrive genuinely after that.
  const lastSeenIdRef = useRef<number | null>(null);

  const refreshList = useCallback(() => {
    setLoading(true);
    getMyNotifications()
      .then((result) => setItems(result.items))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const markAsReadRef = useRef<(id: number) => Promise<void>>(async () => undefined);

  useEffect(() => {
    if (isInitializing) return;
    if (!isAuthenticated) {
      setItems([]);
      setUnreadCount(0);
      lastSeenIdRef.current = null;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const poll = () => {
      getUnreadNotificationCount()
        .then((count) => {
          setUnreadCount(count);
          if (count === 0) return;
          // Only fetch the small recent-list page (not the whole history) when there's actually
          // something unread to check -- keeps the steady-state poll cost to the lightweight
          // count endpoint alone.
          getMyNotifications(1, 10)
            .then((result) => {
              const isFirstPoll = lastSeenIdRef.current === null;
              const freshItems = isFirstPoll
                ? []
                : result.items.filter((n) => !n.isRead && n.id > (lastSeenIdRef.current ?? 0));
              const highestId = result.items.reduce((max, n) => Math.max(max, n.id), lastSeenIdRef.current ?? 0);
              lastSeenIdRef.current = highestId;

              // Oldest first, so toasts appear in the order the events actually happened.
              for (const n of [...freshItems].reverse()) {
                notification.open({
                  message: n.title,
                  description: n.message,
                  placement: 'topRight',
                  onClick: () => {
                    void markAsReadRef.current(n.id);
                    navigate('/cart');
                    notification.destroy(n.id.toString());
                  },
                  key: n.id.toString(),
                });
              }
            })
            .catch(() => undefined);
        })
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
  }, [isAuthenticated, isInitializing, navigate]);

  const markAsRead = useCallback(async (id: number) => {
    try {
      await markNotificationRead(id);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to update this notification.'));
    }
  }, []);
  markAsReadRef.current = markAsRead;

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
