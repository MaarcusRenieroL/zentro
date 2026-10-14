import type { ComponentProps, ReactElement } from "react";

import { cn } from "@zentro/ui/lib/utils";

/** A row of filters and actions above a list or table. */
export function Toolbar({
  className,
  ...props
}: ComponentProps<"div">): ReactElement {
  return (
    <div
      role="toolbar"
      data-slot="toolbar"
      className={cn("flex flex-wrap items-center gap-2", className)}
      {...props}
    />
  );
}
