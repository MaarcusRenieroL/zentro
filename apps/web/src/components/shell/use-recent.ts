"use client";

import { useCallback, useEffect, useState } from "react";

export type RecentItem = { href: string; label: string };

const storageKey = "zentro:recent";
const limit = 5;

function read(): RecentItem[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) ?? "[]");

    return Array.isArray(parsed) ? (parsed as RecentItem[]) : [];
  } catch {
    return [];
  }
}

/** Pages worth coming back to: a task, a doc or a project. */
export function isRecentPath(pathname: string) {
  return (
    /^\/(tasks|docs|projects)\/[^/]+$/.test(pathname) &&
    !/^\/(tasks|docs)\/(overview|my-docs|recent|search|trash|projects)$/.test(
      pathname,
    )
  );
}

/** The last few places visited, kept in this browser only. */
export function useRecent() {
  const [items, setItems] = useState<RecentItem[]>([]);

  useEffect(() => setItems(read()), []);

  const record = useCallback((item: RecentItem) => {
    try {
      const next = [
        item,
        ...read().filter((existing) => existing.href !== item.href),
      ].slice(0, limit);

      localStorage.setItem(storageKey, JSON.stringify(next));
      setItems(next);
    } catch {
      // Storage can be blocked; recents are a convenience.
    }
  }, []);

  return { items, record };
}
