import type { ComponentProps, ReactElement } from "react";

import { cn } from "@zentro/ui/lib/utils";

/** A task key such as ZEN-9. Always mono, always after the state dot. */
export function TaskKey({
  className,
  ...props
}: ComponentProps<"span">): ReactElement {
  return (
    <span
      data-slot="task-key"
      className={cn(
        "shrink-0 font-mono text-xs font-medium tracking-tight text-ink-3 tabular-nums",
        className,
      )}
      {...props}
    />
  );
}
