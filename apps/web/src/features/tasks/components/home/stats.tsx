import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@zentro/ui/shadcn/card";
import {
  CalendarIcon,
  CheckCheckIcon,
  CheckSquareIcon,
  ListTodoIcon,
  type LucideIcon,
} from "lucide-react";
import { FC } from "react";

export type TaskStatCounts = {
  completedLast7Days: number;
  updatedLast7Days: number;
  createdLast7Days: number;
  dueNext7Days: number;
};

type TaskStat = {
  id: string;
  icon: LucideIcon;
  count: number;
  label: string;
  timeframe: string;
};

type Props = {
  counts: TaskStatCounts;
};

export const TaskStats: FC<Props> = ({ counts }) => {
  const stats: TaskStat[] = [
    {
      id: "completed",
      icon: CheckCheckIcon,
      count: counts.completedLast7Days,
      label: "completed",
      timeframe: "in the last 7 days",
    },
    {
      id: "updated",
      icon: ListTodoIcon,
      count: counts.updatedLast7Days,
      label: "updated",
      timeframe: "in the last 7 days",
    },
    {
      id: "created",
      icon: CheckSquareIcon,
      count: counts.createdLast7Days,
      label: "created",
      timeframe: "in the last 7 days",
    },
    {
      id: "due-soon",
      icon: CalendarIcon,
      count: counts.dueNext7Days,
      label: "due soon",
      timeframe: "in the next 7 days",
    },
  ];

  return (
    <section className="grid w-full gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map(({ id, icon: Icon, count, label, timeframe }) => (
        <Card
          key={id}
          className="rounded-2xl border border-hairline/80 bg-surface/80 p-4 shadow-2xs transition-all hover:border-hairline hover:shadow-xs"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-signal/10 text-signal">
              <Icon className="size-5" aria-hidden="true" />
            </div>

            <div className="min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-xl font-bold tracking-tight text-ink">
                  {count}
                </span>
                <span className="truncate text-xs font-medium text-ink-2">
                  {label}
                </span>
              </div>
              <p className="truncate text-[11px] text-ink-3">{timeframe}</p>
            </div>
          </div>
        </Card>
      ))}
    </section>
  );
};
