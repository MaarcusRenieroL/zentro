import { FC } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@zentro/ui/shadcn/card";
import { cn } from "@zentro/ui/lib/utils";

import { priorityBars } from "~/src/features/tasks/lib/constants";
import { PrioritySummary } from "~/src/features/tasks/lib/types";

type Props = {
  priorities: PrioritySummary[];
};

export const PriorityBreakdown: FC<Props> = ({ priorities }) => {
  const max = Math.max(...priorities.map((priority) => priority.count), 1);

  return (
    <Card className="rounded-2xl border border-hairline/80 bg-surface/80 p-5 shadow-2xs">
      <CardHeader className="p-0 pb-4">
        <CardTitle className="text-[15px] font-semibold text-ink">
          Priority breakdown
        </CardTitle>
        <CardDescription className="text-xs text-ink-3">
          See how work is distributed across priority bands.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0 space-y-3.5">
        {priorities.map((priority) => (
          <div
            key={priority.id}
            className="grid grid-cols-[72px_1fr_32px] items-center gap-3.5"
          >
            <span className="text-[13px] font-medium text-ink-2">
              {priority.label}
            </span>

            <div className="h-2.5 overflow-hidden rounded-full bg-muted/60 p-0.5">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  priorityBars[priority.id],
                )}
                style={{ width: `${(priority.count / max) * 100}%` }}
              />
            </div>

            <span className="text-right font-mono text-xs font-semibold text-ink">
              {priority.count}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
