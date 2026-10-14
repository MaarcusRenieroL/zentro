import type { ReactElement, ReactNode } from "react";

import { cn } from "@zentro/ui/lib/utils";

type StatProps = {
  label: string;
  value: ReactNode;
  /** A small trend pill such as "+3 this week". Leave out when no data. */
  trend?: ReactNode;
  className?: string;
};

/** A big serif numeral with a mono label and an optional trend pill. */
export function Stat({
  label,
  value,
  trend,
  className,
}: StatProps): ReactElement {
  return (
    <div data-slot="stat" className={cn("flex flex-col gap-2", className)}>
      <span className="eyebrow">{label}</span>
      <div className="flex items-end gap-3">
        <span className="font-serif-italic text-5xl leading-none text-ink tabular-nums">
          {value}
        </span>
        {trend ? (
          <span className="mb-1 rounded-full bg-success-subtle px-2 py-0.5 font-mono text-[11px] text-success-text">
            {trend}
          </span>
        ) : null}
      </div>
    </div>
  );
}
