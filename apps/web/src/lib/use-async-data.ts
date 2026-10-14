"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type AsyncState<T> =
  | { status: "loading"; data: null; error: null }
  | { status: "ready"; data: T; error: null }
  | { status: "error"; data: null; error: unknown };

/**
 * Loads data for a page and tells loading, error and ready apart, so a failed
 * request is never shown as an empty list. `reload` tries again; the previous
 * data stays on screen while it does.
 */
export function useAsyncData<T>(load: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<AsyncState<T>>({
    status: "loading",
    data: null,
    error: null,
  });
  const [attempt, setAttempt] = useState(0);
  const loadRef = useRef(load);

  loadRef.current = load;

  useEffect(() => {
    let current = true;

    // Keep showing what we have while reloading; only a first load is "loading".
    setState((previous) =>
      previous.status === "ready"
        ? previous
        : { status: "loading", data: null, error: null },
    );

    loadRef
      .current()
      .then((data) => {
        if (current) setState({ status: "ready", data, error: null });
      })
      .catch((error: unknown) => {
        if (current) setState({ status: "error", data: null, error });
      });

    return () => {
      current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, ...deps]);

  const reload = useCallback(() => {
    setState({ status: "loading", data: null, error: null });
    setAttempt((value) => value + 1);
  }, []);

  /** Replaces the data in place (optimistic updates, local edits). */
  const setData = useCallback(
    (next: T | ((previous: T) => T)) =>
      setState((previous) =>
        previous.status === "ready"
          ? {
              status: "ready",
              data:
                typeof next === "function"
                  ? (next as (value: T) => T)(previous.data)
                  : next,
              error: null,
            }
          : previous,
      ),
    [],
  );

  return { ...state, reload, setData };
}

/** A readable message from whatever a failed request threw. */
export function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    const message = String((error as { message: unknown }).message);

    // Do not show raw network failures as the explanation.
    return message && !/fetch|network|json/i.test(message)
      ? message
      : "The server could not be reached.";
  }

  return "Something went wrong.";
}
