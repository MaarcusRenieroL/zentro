import type { ReactElement } from "react";

import { cn } from "@zentro/ui/lib/utils";

type DotMatrixProps = {
  /** One column per entry (a day, an hour); the number is its activity. */
  values: number[];
  /** Labels under each column, same length as `values`. */
  labels?: string[];
  rows?: number;
  label: string;
  className?: string;
};

/** Team activity as a grid of dots: a column lights from the bottom up. */
export function DotMatrix({
  values,
  labels,
  rows = 6,
  label,
  className,
}: DotMatrixProps): ReactElement {
  const peak = Math.max(1, ...values);

  return (
    <div
      role="img"
      aria-label={label}
      data-slot="dot-matrix"
      className={cn("inline-flex flex-col gap-2", className)}
    >
      <div className="flex gap-1.5">
        {values.map((value, column) => {
          const lit = Math.round((value / peak) * rows);

          return (
            <div key={column} className="flex flex-col-reverse gap-1.5">
              {Array.from({ length: rows }, (_, row) => (
                <span
                  key={row}
                  aria-hidden="true"
                  className={cn(
                    "size-2 rounded-full",
                    row < lit ? "bg-status-done" : "bg-pressed",
                  )}
                  style={
                    row < lit
                      ? { opacity: 0.45 + 0.55 * ((row + 1) / rows) }
                      : undefined
                  }
                />
              ))}
            </div>
          );
        })}
      </div>
      {labels ? (
        <div className="flex gap-1.5">
          {labels.map((text, index) => (
            <span
              key={index}
              className="w-2 text-center font-mono text-[10px] text-ink-3"
            >
              {text}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
