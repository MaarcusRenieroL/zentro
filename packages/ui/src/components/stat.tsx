import type { ReactElement, ReactNode } from "react";

import { cn } from "@zentro/ui/lib/utils";

type StatProps = {
  label: string;
  value: ReactNode;
  /** A small trend pill such as "+3 this week". Leave out when no data. */
  trend?: ReactNode;
  className?: string;
};

/** A big serif numeral, its label under it, and an optional trend pill. */
export function Stat({
  label,
  value,
  trend,
  className,
}: StatProps): ReactElement {
  return (
    <div
      data-slot="stat"
      className={cn("flex flex-col items-start gap-1.5", className)}
    >
      <span className="font-serif-italic text-5xl leading-none text-ink tabular-nums">
        {value}
      </span>
      <span className="text-sm text-ink-2">{label}</span>
      {trend ? (
        <span className="mt-1 rounded-full bg-sunken px-2 py-0.5 font-mono text-[11px] text-ink-2">
          {trend}
        </span>
      ) : null}
    </div>
  );
}
