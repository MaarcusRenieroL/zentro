"use client";

import type { ReactElement, ReactNode } from "react";

import { cn } from "@zentro/ui/lib/utils";

type Option<T extends string> = { value: T; label: ReactNode };

type SegmentedControlProps<T extends string> = {
  value: T;
  onValueChange: (value: T) => void;
  options: ReadonlyArray<Option<T>>;
  label: string;
  className?: string;
};

/** A pill group where exactly one option is chosen. Arrow keys move the choice. */
export function SegmentedControl<T extends string>({
  value,
  onValueChange,
  options,
  label,
  className,
}: SegmentedControlProps<T>): ReactElement {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      data-slot="segmented-control"
      className={cn(
        "inline-flex h-[calc(var(--control-h)+4px)] items-center gap-0.5 rounded-full bg-sunken p-1",
        className,
      )}
      onKeyDown={(event) => {
        const step =
          event.key === "ArrowRight" || event.key === "ArrowDown"
            ? 1
            : event.key === "ArrowLeft" || event.key === "ArrowUp"
              ? -1
              : 0;

        if (!step) return;

        event.preventDefault();

        const index = options.findIndex((option) => option.value === value);
        const next = options[(index + step + options.length) % options.length];

        if (next) onValueChange(next.value);
      }}
    >
      {options.map((option) => {
        const active = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onValueChange(option.value)}
            className={cn(
              "inline-flex h-full items-center gap-1.5 rounded-full px-3.5 text-sm font-medium outline-none transition-colors duration-(--duration-fast) focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-4",
              active
                ? "bg-surface text-ink ring-1 ring-hairline"
                : "text-ink-2 hover:text-ink",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
