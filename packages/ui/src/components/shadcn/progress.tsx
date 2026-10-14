"use client";

import * as React from "react";
import { Progress as ProgressPrimitive } from "radix-ui";

import { cn } from "@zentro/ui/lib/utils";

/**
 * A bar that fills; `value` is 0 to 100. It fills with the done color and a
 * soft glow, brighter at 100. `tone="accent"` is for non-completion progress.
 */
function Progress({
  className,
  value,
  tone = "done",
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & {
  tone?: "done" | "accent";
}) {
  const complete = (value ?? 0) >= 100;

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={value}
      className={cn(
        "relative h-1.5 w-full overflow-hidden rounded-full bg-pressed",
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        data-complete={complete || undefined}
        className={cn(
          "h-full w-full flex-1 rounded-full transition-transform duration-(--duration-fill) ease-(--ease-out) motion-reduce:transition-none",
          tone === "done"
            ? "bg-status-done shadow-[0_0_10px_var(--done-glow)] data-complete:shadow-[0_0_16px_var(--done-glow)]"
            : "bg-primary",
        )}
        style={{ transform: `translateX(-${100 - (value ?? 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
