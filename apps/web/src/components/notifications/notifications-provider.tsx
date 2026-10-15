"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useTrpcClient } from "@zentro/api/react";

import type { NotificationItem } from "./notifications";

export type NotificationsState = "loading" | "ready" | "error";

type NotificationsValue = {
  items: NotificationItem[];
  unreadCount: number;
  state: NotificationsState;
  reload: () => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  /** Approve or decline resolves the request, so it leaves the unread list. */
  resolve: (id: string) => void;
};

const NotificationsContext = createContext<NotificationsValue | null>(null);

// New work shows up within a minute without a reload.
const POLL_MS = 60_000;

/**
 * Notification state shared by the bell and the inbox. In the workspace the
 * items come from the server (assignments, comments, mentions) and read marks
 * are saved there. The dev gallery passes `initial` and stays local.
 */
export function NotificationsProvider({
  initial,
  children,
}: {
  initial?: NotificationItem[];
  children: ReactNode;
}) {
  const trpc = useTrpcClient();
  const live = initial === undefined;
  const [items, setItems] = useState<NotificationItem[]>(initial ?? []);
  const [state, setState] = useState<NotificationsState>(
    live ? "loading" : "ready",
  );
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!live) return;

    let active = true;

    const load = () =>
      trpc.notification.list
        .query()
        .then((rows) => {
          if (!active) return;

          setItems(
            rows.map((row) => ({
              id: row.id,
              kind: row.kind,
              actor: row.actor,
              verb: row.verb,
              object: row.object,
              objectIsKey: row.objectIsKey,
              title: row.title ?? undefined,
              quote: row.quote ?? undefined,
              unread: row.unread,
              createdAt: new Date(row.createdAt).toISOString(),
              href: row.href,
            })),
          );
          setState("ready");
        })
        .catch(() => {
          // Keep what is on screen after a failed refresh.
          if (active)
            setState((current) => (current === "ready" ? current : "error"));
        });

    void load();

    const id = setInterval(load, POLL_MS);

    return () => {
      active = false;
      clearInterval(id);
    };
  }, [live, trpc, tick]);

  const markAllRead = useCallback(() => {
    setItems((current) => current.map((n) => ({ ...n, unread: false })));
    if (live) void trpc.notification.markAllRead.mutate().catch(() => null);
  }, [live, trpc]);
  const markRead = useCallback(
    (id: string) => {
      setItems((current) =>
        current.map((n) => (n.id === id ? { ...n, unread: false } : n)),
      );
      if (live)
        void trpc.notification.markRead.mutate({ id }).catch(() => null);
    },
    [live, trpc],
  );
  const resolve = useCallback(
    (id: string) => setItems((current) => current.filter((n) => n.id !== id)),
    [],
  );
  const reload = useCallback(() => {
    setState("loading");
    setTick((value) => value + 1);
  }, []);

  const value = useMemo(
    () => ({
      items,
      unreadCount: items.filter((n) => n.unread).length,
      state,
      reload,
      markAllRead,
      markRead,
      resolve,
    }),
    [items, state, reload, markAllRead, markRead, resolve],
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
