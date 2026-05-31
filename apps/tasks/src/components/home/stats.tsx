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

type TaskStat = {
  id: string;
  icon: LucideIcon;
  count: number;
  label: string;
  timeframe: string;
};

const stats: TaskStat[] = [
  {
    id: "completed",
    icon: CheckCheckIcon,
    count: 0,
    label: "completed",
    timeframe: "in the last 7 days",
  },
  {
    id: "updated",
    icon: ListTodoIcon,
    count: 4,
    label: "updated",
    timeframe: "in the last 7 days",
  },
  {
    id: "created",
    icon: CheckSquareIcon,
    count: 4,
    label: "created",
    timeframe: "in the last 7 days",
  },
  {
    id: "due-soon",
    icon: CalendarIcon,
    count: 1,
    label: "due soon",
    timeframe: "in the next 7 days",
  },
];

export const TaskStats = () => {
  return (
    <section className="grid w-full gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map(({ id, icon: Icon, count, label, timeframe }) => (
        <Card key={id} className="rounded-lg">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <Icon className="size-5" aria-hidden="true" />
            </div>

            <div className="min-w-0">
              <CardTitle className="flex items-baseline gap-1 text-base font-semibold">
                <span>{count}</span>
                <span className="truncate">{label}</span>
              </CardTitle>
              <CardDescription className="truncate">
                {timeframe}
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      ))}
    </section>
  );
};
