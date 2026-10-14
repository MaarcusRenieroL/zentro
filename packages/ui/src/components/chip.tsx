import type { ComponentProps, ReactElement } from "react";
import { XIcon } from "lucide-react";

import { cn } from "@zentro/ui/lib/utils";

type ChipProps = ComponentProps<"span"> & {
  tone?: "neutral" | "accent";
  /** Shows a remove button; the label names what is removed. */
  onRemove?: () => void;
  removeLabel?: string;
};

/** A small 8px-radius chip for filters, tags and selected values. */
export function Chip({
  tone = "neutral",
  onRemove,
  removeLabel = "Remove",
  className,
  children,
  ...props
}: ChipProps): ReactElement {
  return (
    <span
      data-slot="chip"
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-sm px-2 text-xs font-medium",
        tone === "accent"
          ? "bg-signal-subtle text-signal"
          : "bg-sunken text-ink-2",
        className,
      )}
      {...props}
    >
      {children}
      {onRemove ? (
        <button
          type="button"
          aria-label={removeLabel}
          onClick={onRemove}
          className="-mr-1 inline-flex size-4 items-center justify-center rounded-xs outline-none hover:bg-pressed focus-visible:ring-2 focus-visible:ring-ring"
        >
          <XIcon className="size-3" aria-hidden="true" />
        </button>
      ) : null}
    </span>
  );
}
