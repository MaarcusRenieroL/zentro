"use client";

import { useCallback, useEffect, useState } from "react";

/** Counts whole seconds down to zero. `start(seconds)` begins a new run. */
export function useCountdown(initial = 0) {
  const [seconds, setSeconds] = useState(initial);

  useEffect(() => {
    if (seconds <= 0) return;

    const id = setTimeout(() => setSeconds((value) => value - 1), 1000);

    return () => clearTimeout(id);
  }, [seconds]);

  const start = useCallback((value: number) => setSeconds(value), []);

  return { seconds, start, done: seconds <= 0 };
}

/** 292 -> "04:52". */
export function formatMmSs(total: number, pad = true) {
  const minutes = Math.floor(total / 60);
  const rest = String(total % 60).padStart(2, "0");

  return `${pad ? String(minutes).padStart(2, "0") : minutes}:${rest}`;
}
