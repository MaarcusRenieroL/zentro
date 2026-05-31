import { FC } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@zentro/ui/shadcn/card";
import { cn } from "@zentro/ui/lib/utils";

import { PrioritySummary } from "~/src/lib/types";

type Props = {
  priorities: PrioritySummary[];
};

export const PriorityBreakdown: FC<Props> = ({ priorities }) => {
  const max = Math.max(...priorities.map((priority) => priority.count), 1);

  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle className="text-base">Priority breakdown</CardTitle>
        <CardDescription>
          See how work is distributed by priority.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {priorities.map((priority) => (
          <div
            key={priority.id}
            className="grid grid-cols-[72px_1fr_24px] items-center gap-3"
          >
            <span className="text-sm font-medium">{priority.label}</span>

            <div className="h-8 rounded-sm bg-muted">
              <div
                className={cn("h-full rounded-sm", priority.color)}
                style={{ width: `${(priority.count / max) * 100}%` }}
              />
            </div>

            <span className="text-right text-sm text-muted-foreground">
              {priority.count}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
