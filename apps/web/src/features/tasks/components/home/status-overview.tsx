import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@zentro/ui/shadcn/card";
import { cn } from "@zentro/ui/lib/utils";
import { statusColors } from "~/src/features/tasks/lib/constants";
import { StatusSummary } from "~/src/features/tasks/lib/types";
import { FC } from "react";

type Props = {
  statuses: StatusSummary[];
};

function getTotal(items: { count: number }[]) {
  return items.reduce((total, item) => total + item.count, 0);
}

function getRingGradient(statuses: StatusSummary[], total: number) {
  if (!total) {
    return undefined;
  }

  let from = 0;
  const stops = statuses
    .filter((status) => status.count > 0)
    .map((status) => {
      const to = from + (status.count / total) * 100;
      const stop = `${statusColors[status.id].css} ${from}% ${to}%`;

      from = to;

      return stop;
    });

  return `conic-gradient(${stops.join(", ")})`;
}

export const StatusOverview: FC<Props> = ({ statuses }) => {
  const total = getTotal(statuses);
  const complete = statuses.find((status) => status.id === "done")?.count ?? 0;
  const completePercentage = total ? Math.round((complete / total) * 100) : 0;

  return (
    <Card className="rounded-2xl border border-hairline/80 bg-surface/80 p-5 shadow-2xs">
      <CardHeader className="p-0 pb-4">
        <CardTitle className="text-[15px] font-semibold text-ink">
          Status overview
        </CardTitle>
        <CardDescription className="text-xs text-ink-3">
          Get a snapshot of where work items stand right now.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-6 p-0 md:grid-cols-[220px_minmax(0,1fr)] md:items-center">
        <div
          className="relative mx-auto flex size-44 items-center justify-center rounded-full bg-muted/60 p-2 shadow-inner"
          style={{ backgroundImage: getRingGradient(statuses, total) }}
        >
          <div className="flex size-30 flex-col items-center justify-center rounded-full border border-hairline/60 bg-surface text-center shadow-xs">
            <span className="font-mono text-3xl font-bold tracking-tight text-ink">
              {total}
            </span>
            <span className="mt-0.5 text-[11px] font-medium text-ink-3">
              Total tasks
            </span>
          </div>
        </div>

        <div className="space-y-3.5">
          {statuses.map((status) => (
            <div key={status.id} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-xs">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className={cn(
                      "size-2.5 rounded-full",
                      statusColors[status.id].bar,
                    )}
                  />
                  <span className="truncate text-[13px] font-medium text-ink-2">
                    {status.label}
                  </span>
                </div>

                <span className="font-mono text-xs font-semibold text-ink">
                  {status.count}
                </span>
              </div>

              <div className="h-1.5 overflow-hidden rounded-full bg-muted/60">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    statusColors[status.id].bar,
                  )}
                  style={{
                    width: `${total ? (status.count / total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          ))}

          <p className="pt-1 text-[11px] font-medium text-ink-3">
            <span className="font-mono text-signal">{completePercentage}%</span>{" "}
            of work is marked done.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
