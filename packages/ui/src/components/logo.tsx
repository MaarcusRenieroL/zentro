import type { ComponentProps, ReactElement } from "react";

import { cn } from "@zentro/ui/lib/utils";

/**
 * The Zentro mark: a Z drawn as one continuous stroke with a node at each end,
 * "everything is connected" in a single gesture. It draws in `currentColor`,
 * so it works in one color on any surface.
 */
export function LogoMark({
  className,
  title = "Zentro",
  ...props
}: Omit<ComponentProps<"svg">, "children"> & { title?: string }): ReactElement {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-label={title}
      data-slot="logo-mark"
      className={cn("size-6 shrink-0", className)}
      {...props}
    >
      <path
        d="M7.5 8h17L7.5 24h17"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="7.5" cy="8" r="3.1" fill="currentColor" />
      <circle cx="24.5" cy="24" r="3.1" fill="currentColor" />
    </svg>
  );
}

/** The name, set in Geist 600 with slightly tight tracking. */
export function Wordmark({
  className,
  ...props
}: ComponentProps<"span">): ReactElement {
  return (
    <span
      data-slot="wordmark"
      className={cn(
        "text-[1.0625rem] leading-none font-semibold tracking-[-0.025em]",
        className,
      )}
      {...props}
    >
      Zentro
    </span>
  );
}

/** Mark and wordmark together. The mark carries the accent; the name is ink. */
export function Logo({
  className,
  markClassName,
}: {
  className?: string;
  markClassName?: string;
}): ReactElement {
  return (
    <span
      data-slot="logo"
      className={cn("inline-flex items-center gap-2 text-ink", className)}
    >
      <LogoMark
        aria-hidden="true"
        className={cn("size-6 text-signal", markClassName)}
        title=""
      />
      <Wordmark />
    </span>
  );
}
