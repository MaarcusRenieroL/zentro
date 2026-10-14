"use client";

import { formatDueDate, type DueTone } from "@zentro/utils";
import { cn } from "@zentro/ui/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@zentro/ui/shadcn/tooltip";

const tones: Record<DueTone, string> = {
  overdue: "text-danger-text",
  soon: "text-warning-text",
  later: "text-ink-2",
  none: "text-ink-3",
};

type Props = {
  value: Date | string | null | undefined;
  /** A finished task is never overdue or urgent. */
  done?: boolean;
  className?: string;
};

/** A due date as it reads in a list: short, mono, never wrapping, colored by urgency. */
export function DueDate({ value, done = false, className }: Props) {
  const due = formatDueDate(value);
  const tone = done ? "later" : due.tone;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <time
          dateTime={value ? new Date(value).toISOString() : undefined}
          title={due.full}
          aria-label={due.full}
          className={cn(
            "font-mono text-xs whitespace-nowrap",
            tones[tone],
            className,
          )}
        >
          {due.text}
        </time>
      </TooltipTrigger>
      <TooltipContent>{due.full}</TooltipContent>
    </Tooltip>
  );
}
