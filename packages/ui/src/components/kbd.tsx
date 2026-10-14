import type { ComponentProps, ReactElement } from "react";

import { cn } from "@zentro/ui/lib/utils";

export function Kbd({
  className,
  ...props
}: ComponentProps<"kbd">): ReactElement {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "pointer-events-none inline-flex h-5 min-w-5 items-center justify-center rounded border border-border-default bg-sunken px-1 font-mono text-[0.6875rem] font-medium text-ink-2 select-none",
        className,
      )}
      {...props}
    />
  );
}
