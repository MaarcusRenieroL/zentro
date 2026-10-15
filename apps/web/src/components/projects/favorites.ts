"use client";

import { useCallback, useEffect, useState } from "react";

const storageKey = "zentro:favorite-projects";

function read(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) ?? "[]");

    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

/**
 * Starred projects. Kept in this browser only for now: there is no shared
 * favorites list on the server yet.
 */
export function useFavoriteProjects() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => setIds(read()), []);

  const toggle = useCallback((id: string) => {
    setIds((current) => {
      const next = current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id];

      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // Storage can be blocked; the star still works for this visit.
      }

      return next;
    });
  }, []);

  return { ids, isFavorite: (id: string) => ids.includes(id), toggle };
}
