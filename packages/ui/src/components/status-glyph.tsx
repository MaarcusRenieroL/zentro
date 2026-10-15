import type { ReactElement } from "react";

import { cn } from "@zentro/ui/lib/utils";

export const statusLabels: Record<string, string> = {
  backlog: "Backlog",
  todo: "To do",
  "in-progress": "In progress",
  review: "In review",
  done: "Done",
};

export const priorityLabels: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const fractions: Record<string, number> = {
  "in-progress": 0.5,
  review: 0.75,
};

const colors: Record<string, string> = {
  backlog: "text-status-backlog",
  todo: "text-status-todo",
  "in-progress": "text-status-progress",
  review: "text-status-review",
  done: "text-status-done",
};

type StatusGlyphProps = {
  /** A task status: backlog, todo, in-progress, review or done. */
  status: string;
  size?: number;
  className?: string;
  /** Hide from assistive tech when the label sits next to it. */
  decorative?: boolean;
  /** Plays the one expressive moment: fill, glow and a single ring pulse. */
  celebrate?: boolean;
};

/**
 * Status as a circle that fills as work progresses: dashed for backlog, empty
 * for to do, half for in progress, three-quarters for review, a check when
 * done. It always carries its label for assistive tech.
 */
export function StatusGlyph({
  status,
  size = 16,
  className,
  decorative = false,
  celebrate = false,
}: StatusGlyphProps): ReactElement {
  const fraction = fractions[status];
  const circumference = 2 * Math.PI * 3;

  const glyph = (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      fill="none"
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : (statusLabels[status] ?? status)}
      aria-hidden={decorative || undefined}
      data-status={status}
      className={cn(
        "shrink-0 transition-[color,filter] duration-200",
        colors[status] ?? "text-status-todo",
        status === "done" && "drop-shadow-[0_0_5px_var(--done-glow)]",
        className,
      )}
    >
      {status === "done" ? (
        <>
          <circle cx="8" cy="8" r="7" fill="currentColor" />
          <path
            d="M5 8.3 7.1 10.4 11 6"
            stroke="var(--on-success)"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : (
        <>
          <circle
            cx="8"
            cy="8"
            r="6.25"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray={status === "backlog" ? "2 2.1" : undefined}
          />
          {fraction ? (
            <circle
              cx="8"
              cy="8"
              r="3"
              stroke="currentColor"
              strokeWidth="6"
              strokeDasharray={`${fraction * circumference} ${circumference}`}
              transform="rotate(-90 8 8)"
            />
          ) : null}
        </>
      )}
    </svg>
  );

  if (!celebrate || status !== "done") return glyph;

  return (
    <span className="relative inline-flex shrink-0">
      {glyph}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-full border-2 border-status-done motion-safe:animate-ring-pulse motion-reduce:hidden"
      />
    </span>
  );
}

const bars = { low: 1, medium: 2, high: 3 } as const;

type PriorityGlyphProps = {
  /** A task priority: low, medium or high. */
  priority: string;
  size?: number;
  className?: string;
  decorative?: boolean;
};

/** Priority as three small bars, filled up to the level. */
export function PriorityGlyph({
  priority,
  size = 16,
  className,
  decorative = false,
}: PriorityGlyphProps): ReactElement {
  const level = bars[priority as keyof typeof bars] ?? 2;
  const tone =
    priority === "high"
      ? "text-priority-high"
      : priority === "low"
        ? "text-priority-low"
        : "text-priority-medium";

  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      role={decorative ? undefined : "img"}
      aria-label={
        decorative
          ? undefined
          : `Priority: ${priorityLabels[priority] ?? priority}`
      }
      aria-hidden={decorative || undefined}
      data-priority={priority}
      className={cn("shrink-0", tone, className)}
    >
      {[0, 1, 2].map((index) => (
        <rect
          key={index}
          x={2 + index * 4.5}
          y={11 - index * 3.5}
          width="3"
          height={3 + index * 3.5}
          rx="1"
          fill="currentColor"
          opacity={index < level ? 1 : 0.28}
        />
      ))}
    </svg>
  );
}

const meterLevels = { low: 1, medium: 2, high: 3 } as const;

/**
 * Priority as four rising bars, filled up to the level (the list and the focus
 * tile draw it this way). Always ink, never a state color.
 */
export function PriorityMeter({
  priority,
  className,
}: {
  priority: string;
  className?: string;
}): ReactElement {
  const level = meterLevels[priority as keyof typeof meterLevels] ?? 2;

  return (
    <span
      role="img"
      aria-label={`Priority: ${priorityLabels[priority] ?? priority}`}
      data-priority={priority}
      className={cn(
        "flex h-[13px] w-[18px] shrink-0 items-end gap-0.5",
        className,
      )}
    >
      {[4, 7, 10, 13].map((height, index) => (
        <span
          key={height}
          style={{ height }}
          className={cn(
            "w-[3px] rounded-[1px]",
            index < level ? "bg-ink" : "bg-hairline",
          )}
        />
      ))}
    </span>
  );
}

/** Spec name for the state dot: the same glyph, the task's one color. */
export const TaskStateDot = StatusGlyph;
export const PriorityBars = PriorityGlyph;
