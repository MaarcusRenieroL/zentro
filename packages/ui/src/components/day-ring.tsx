import type { ReactElement } from "react";

import { cn } from "@zentro/ui/lib/utils";

type DayRingProps = {
  done: number;
  planned: number;
  size?: number;
  className?: string;
};

/** Done today over planned today. Fills with the done color; brighter at 100%. */
export function DayRing({
  done,
  planned,
  size = 120,
  className,
}: DayRingProps): ReactElement {
  const total = Math.max(planned, done, 0);
  const ratio = total === 0 ? 0 : Math.min(1, done / total);
  // Only a plan that was made and met counts as complete.
  const complete = total > 0 && ratio >= 1;
  const radius = 44;
  const circumference = 2 * Math.PI * radius;

  return (
    <div
      role="img"
      aria-label={
        total === 0
          ? "Nothing planned today"
          : `${done} of ${total} tasks done today`
      }
      data-slot="day-ring"
      data-complete={complete || undefined}
      className={cn("relative inline-flex shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className="-rotate-90"
      >
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="8"
          className="stroke-pressed"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ratio)}
          className={cn(
            "stroke-status-done transition-[stroke-dashoffset] duration-(--duration-fill) ease-(--ease-out) motion-reduce:transition-none",
            complete
              ? "drop-shadow-[0_0_8px_var(--done-glow)]"
              : "drop-shadow-[0_0_4px_var(--done-glow)]",
          )}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-3 text-center leading-none">
        {total === 0 ? (
          <span className="font-mono text-[11px] leading-tight text-ink-3">
            Nothing planned
          </span>
        ) : (
          <>
            <span
              className="font-serif-italic text-ink"
              style={{ fontSize: size * 0.34 }}
            >
              {done}
            </span>
            <span className="mt-1 font-mono text-[11px] tracking-wide text-ink-3">
              of {total}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
