import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@zentro/ui/shadcn/card";
import {
  CalendarIcon,
  CheckCircle2Icon,
  FileTextIcon,
  UsersIcon,
} from "lucide-react";
import { FC } from "react";
import { formatRelativeDate } from "~/src/lib/helpers";

type Props = {
  openTasks: number;
  totalTasks: number;
  totalDocs: number;
  totalMembers: number;
  updatedAt: Date;
};

const formatDate = (date: Date) => {
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const ProjectSummary: FC<Props> = ({
  openTasks,
  totalTasks,
  totalDocs,
  totalMembers,
  updatedAt,
}) => {
  return (
    <div className="grid w-full gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card className="bg-card/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Open Tasks
          </CardTitle>
          <div className="flex size-9 items-center justify-center rounded-xl bg-sunken">
            <CheckCircle2Icon className="size-4 text-primary" />
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold leading-none text-foreground">
              {openTasks}
            </span>
            <span className="text-sm text-muted-foreground">
              of {totalTasks}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Docs
          </CardTitle>
          <div className="flex size-9 items-center justify-center rounded-xl bg-sunken">
            <FileTextIcon className="size-4 text-primary" />
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold leading-none text-foreground">
              {totalDocs}
            </span>
            <span className="text-sm text-muted-foreground">total</span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Members
          </CardTitle>
          <div className="flex size-9 items-center justify-center rounded-xl bg-sunken">
            <UsersIcon className="size-4 text-primary" />
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold leading-none text-foreground">
              {totalMembers}
            </span>
            <span className="text-sm text-muted-foreground">in org</span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Updated
          </CardTitle>
          <div className="flex size-9 items-center justify-center rounded-xl bg-sunken">
            <CalendarIcon className="size-4 text-primary" />
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col gap-2">
            <span className="text-xl font-bold leading-none text-foreground">
              {formatRelativeDate(updatedAt)}
            </span>
            <span className="text-sm text-muted-foreground">
              {formatDate(updatedAt)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
