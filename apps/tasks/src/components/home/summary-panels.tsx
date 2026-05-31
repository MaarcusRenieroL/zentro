import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@zentro/ui/shadcn/card";
import { cn } from "@zentro/ui/lib/utils";

import type { PrioritySummary, StatusSummary, WorkTypeSummary } from "./data";

type StatusOverviewProps = {
  statuses: StatusSummary[];
};

type PriorityBreakdownProps = {
  priorities: PrioritySummary[];
};

type WorkTypesProps = {
  types: WorkTypeSummary[];
};

function getTotal(items: { count: number }[]) {
  return items.reduce((total, item) => total + item.count, 0);
}

export const StatusOverview = ({ statuses }: StatusOverviewProps) => {
  const total = getTotal(statuses);
  const complete = statuses.find((status) => status.id === "done")?.count ?? 0;
  const completePercentage = total ? Math.round((complete / total) * 100) : 0;

  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle className="text-base">Status overview</CardTitle>
        <CardDescription>
          Get a snapshot of where work items stand right now.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-[240px_minmax(0,1fr)] md:items-center">
        <div className="relative mx-auto flex size-48 items-center justify-center rounded-full bg-[conic-gradient(var(--color-primary)_0_25%,var(--color-blue-500)_25%_50%,var(--color-amber-500)_50%_62%,var(--color-emerald-500)_62%_100%)]">
          <div className="flex size-32 flex-col items-center justify-center rounded-full bg-card text-center">
            <span className="text-3xl font-semibold">{total}</span>
            <span className="mt-1 text-xs text-muted-foreground">
              Total work items
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {statuses.map((status) => (
            <div key={status.id} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <div className="flex min-w-0 items-center gap-2">
                  <span className={cn("size-2.5 rounded-sm", status.color)} />
                  <span className="truncate font-medium">{status.label}</span>
                </div>
                <span className="text-muted-foreground">{status.count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn("h-full rounded-full", status.color)}
                  style={{
                    width: `${total ? (status.count / total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          ))}

          <p className="text-xs text-muted-foreground">
            {completePercentage}% of work is marked done.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export const PriorityBreakdown = ({ priorities }: PriorityBreakdownProps) => {
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

export const WorkTypes = ({ types }: WorkTypesProps) => {
  const total = getTotal(types);

  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle className="text-base">Types of work</CardTitle>
        <CardDescription>Breakdown of work items by category.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {types.map((type) => {
          const percentage = total ? Math.round((type.count / total) * 100) : 0;

          return (
            <div key={type.id} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <div className="flex min-w-0 items-center gap-2">
                  <span className={cn("size-2.5 rounded-sm", type.color)} />
                  <span className="truncate font-medium">{type.label}</span>
                </div>
                <span className="text-muted-foreground">{percentage}%</span>
              </div>
              <div className="h-7 overflow-hidden rounded-sm bg-muted">
                <div
                  className={cn("h-full rounded-sm", type.color)}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
