"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useTrpcClient } from "@zentro/api/react";
import { toastError } from "@zentro/ui/index";

export type FavoriteType = "project" | "doc" | "task";

export type FavoriteItem = {
  type: FavoriteType;
  id: string;
  title: string;
  key: string | null;
  href: string;
};

// One list per page load, shared by every star and list that shows it.
let cache: FavoriteItem[] | null = null;
let inflight: Promise<FavoriteItem[]> | null = null;
const listeners = new Set<(items: FavoriteItem[]) => void>();

function publish(items: FavoriteItem[]) {
  cache = items;
  listeners.forEach((listener) => listener(items));
}

/** The caller's stars, saved on the server and filtered by access. */
export function useFavorites() {
  const trpc = useTrpcClient();
  const [items, setItems] = useState<FavoriteItem[] | null>(cache);

  useEffect(() => {
    listeners.add(setItems);

    if (!cache) {
      inflight ??= trpc.favorite.list
        .query()
        .then((rows) => rows as FavoriteItem[])
        .catch(() => []);
      void inflight.then((rows) => {
        inflight = null;
        publish(rows);
      });
    }

    return () => {
      listeners.delete(setItems);
    };
  }, [trpc]);

  const toggle = useCallback(
    async (target: Omit<FavoriteItem, "key"> & { key?: string | null }) => {
      const current = cache ?? [];
      const starred = current.some(
        (item) => item.type === target.type && item.id === target.id,
      );

      // Show the change at once; undo it if the server says no.
      publish(
        starred
          ? current.filter(
              (item) => !(item.type === target.type && item.id === target.id),
            )
          : [...current, { ...target, key: target.key ?? null }],
      );

      try {
        await trpc.favorite.toggle.mutate({ type: target.type, id: target.id });
      } catch (error) {
        publish(current);
        toastError(error, "Could not update the star");
      }
    },
    [trpc],
  );

  const isFavorite = useCallback(
    (type: FavoriteType, id: string) =>
      Boolean(items?.some((item) => item.type === type && item.id === id)),
    [items],
  );

  return { items, isFavorite, toggle };
}

/** Starred projects, as the projects list and header use them. */
export function useFavoriteProjects() {
  const { items, toggle } = useFavorites();
  const ids = useMemo(
    () =>
      (items ?? [])
        .filter((item) => item.type === "project")
        .map((item) => item.id),
    [items],
  );

  return {
    ids,
    isFavorite: (id: string) => ids.includes(id),
    toggle: (id: string, title = "", href = "") =>
      void toggle({ type: "project", id, title, href }),
  };
}
