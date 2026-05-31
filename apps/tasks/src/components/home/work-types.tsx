import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@zentro/ui/shadcn/card";
import { cn } from "@zentro/ui/lib/utils";
import { WorkTypeSummary } from "~/src/lib/types";
import { FC } from "react";

type Props = {
  types: WorkTypeSummary[];
};

function getTotal(items: { count: number }[]) {
  return items.reduce((total, item) => total + item.count, 0);
}

export const WorkTypes: FC<Props> = ({ types }) => {
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
