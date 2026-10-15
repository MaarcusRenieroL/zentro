"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@zentro/ui/shadcn/button";

const clock = (date: Date) =>
  date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

/**
 * Shown above the page while the browser has no connection. Zentro does not
 * queue edits offline, so it says what is true: reconnect to save.
 */
export function OfflineBanner() {
  const [online, setOnline] = useState(true);
  const [checking, setChecking] = useState(false);
  const lastSynced = useRef(new Date());

  useEffect(() => {
    setOnline(navigator.onLine);

    const goOnline = () => {
      lastSynced.current = new Date();
      setOnline(true);
    };
    const goOffline = () => setOnline(false);

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (online) return null;

  const retry = async () => {
    setChecking(true);

    try {
      await fetch("/auth/sign-in", { method: "HEAD", cache: "no-store" });
      lastSynced.current = new Date();
      setOnline(true);
    } catch {
      // Still offline.
    } finally {
      setChecking(false);
    }
  };

  return (
    <div
      role="status"
      className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-hairline bg-surface py-3 pr-3.5 pl-4"
    >
      <span aria-hidden="true" className="size-2 rounded-full bg-ink-3" />
      <p className="text-sm">
        <strong className="font-semibold">You’re offline.</strong>{" "}
        <span className="text-ink-2">
          Reconnect to save changes. What you see may be out of date.
        </span>
      </p>
      <div className="flex-1" />
      <span className="font-mono text-xs text-ink-3">
        Last synced {clock(lastSynced.current)}
      </span>
      <Button variant="outline" size="sm" loading={checking} onClick={retry}>
        Retry now
      </Button>
    </div>
  );
}
