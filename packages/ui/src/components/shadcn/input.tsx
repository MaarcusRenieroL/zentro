import * as React from "react";

import { cn } from "@zentro/ui/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-(--control-h) w-full min-w-0 rounded-md border border-border-strong bg-surface px-3 hover:border-ink-3 py-1 text-sm text-ink transition-[border-color,box-shadow] duration-[var(--duration-fast)] outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-ink placeholder:text-ink-3 focus-visible:border-ring focus-visible:shadow-[0_0_0_0.5px_var(--color-ring)] focus-visible:ring-4 focus-visible:ring-ring/22 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-sunken disabled:text-ink-disabled aria-invalid:border-danger aria-invalid:shadow-[0_0_0_0.5px_var(--color-danger)]",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
