"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { cn } from "@zentro/ui/lib/utils";

/**
 * Fades and lifts its children in as they approach the viewport. The resting
 * state is visible: content is only hidden under `.js` (set before first paint)
 * and never under reduced motion (see globals.css). Anything still hidden
 * after 1.5 seconds is shown regardless, so a fast scroll cannot strand it.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;

    if (!node) return;

    const show = () => node.setAttribute("data-revealed", "");

    if (!("IntersectionObserver" in window)) {
      show();

      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          show();
          observer.disconnect();
        }
      },
      { rootMargin: "200px 0px 200px 0px" },
    );

    observer.observe(node);

    const fallback = setTimeout(show, 1500);

    return () => {
      observer.disconnect();
      clearTimeout(fallback);
    };
  }, []);

  return (
    <div
      ref={ref}
      data-reveal=""
      style={delay ? { transitionDelay: `${delay}s` } : undefined}
      className={cn(className)}
    >
      {children}
    </div>
  );
}
