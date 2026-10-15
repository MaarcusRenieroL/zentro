"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { NotificationItem } from "./notifications";

type NotificationsValue = {
  items: NotificationItem[];
  unreadCount: number;
  markAllRead: () => void;
  markRead: (id: string) => void;
  /** Approve or decline resolves the request, so it leaves the unread list. */
  resolve: (id: string) => void;
};

const NotificationsContext = createContext<NotificationsValue | null>(null);

/**
 * Notification state shared by the bell and the inbox. There is no
 * notification source yet, so the workspace passes none and both show the
 * "all caught up" state; the sample data lives with the dev gallery.
 */
export function NotificationsProvider({
  initial = [],
  children,
}: {
  initial?: NotificationItem[];
  children: ReactNode;
}) {
  const [items, setItems] = useState(initial);

  const markAllRead = useCallback(
    () => setItems((current) => current.map((n) => ({ ...n, unread: false }))),
    [],
  );
  const markRead = useCallback(
    (id: string) =>
      setItems((current) =>
        current.map((n) => (n.id === id ? { ...n, unread: false } : n)),
      ),
    [],
  );
  const resolve = useCallback(
    (id: string) => setItems((current) => current.filter((n) => n.id !== id)),
    [],
  );

  const value = useMemo(
    () => ({
      items,
      unreadCount: items.filter((n) => n.unread).length,
      markAllRead,
      markRead,
      resolve,
    }),
    [items, markAllRead, markRead, resolve],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsValue {
  const value = useContext(NotificationsContext);

  if (!value) {
    throw new Error("useNotifications needs a NotificationsProvider");
  }

  return value;
}
