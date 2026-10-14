"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * A thin bar at the top of the page while a navigation is in flight. It starts
 * on an internal link click and finishes when the location changes.
 */
export function RouteProgress() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const [state, setState] = useState<"idle" | "running" | "done">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const anchor = (event.target as Element | null)?.closest("a");

      if (
        !anchor ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download") ||
        anchor.origin !== window.location.origin
      ) {
        return;
      }

      if (
        anchor.pathname === window.location.pathname &&
        anchor.search === window.location.search
      ) {
        return;
      }

      setState("running");

      if (timer.current) clearTimeout(timer.current);

      // Never leave the bar hanging.
      timer.current = setTimeout(() => setState("idle"), 10_000);
    };

    document.addEventListener("click", onClick, true);

    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    setState((current) => (current === "running" ? "done" : current));

    const finish = setTimeout(
      () => setState((current) => (current === "done" ? "idle" : current)),
      260,
    );

    return () => clearTimeout(finish);
  }, [pathname, search]);

  return (
    <div
      aria-hidden="true"
      data-state={state}
      className="pointer-events-none fixed inset-x-0 top-0 z-(--z-progress) h-0.5"
    >
      <div
        className="h-full origin-left bg-primary transition-[transform,opacity] ease-[var(--ease-out)] data-[state=idle]:opacity-0"
        data-state={state}
        style={{
          transform:
            state === "idle"
              ? "scaleX(0)"
              : state === "running"
                ? "scaleX(0.8)"
                : "scaleX(1)",
          transitionDuration: state === "running" ? "2400ms" : "180ms",
        }}
      />
    </div>
  );
}
