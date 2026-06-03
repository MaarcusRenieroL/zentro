import { FilterIcon, SearchIcon } from "lucide-react";

import { Button } from "@zentro/ui/shadcn/button";
import { Input } from "@zentro/ui/shadcn/input";
import { FC } from "react";
import { CreateTaskModal } from "../create-task-modal";

type Props = {
  title: string;
  description: string;
  taskCount: number;
  projectScoped?: boolean;
};

export const TaskWorkspaceHeader: FC<Props> = ({
  title,
  description,
  taskCount,
  projectScoped = false,
}) => {
  return (
    <div className="flex flex-col gap-5 border-b pb-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">
            {projectScoped ? "Project tasks" : "All tasks"}
          </p>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            {title}
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {description}
          </p>
        </div>

        <CreateTaskModal />
      </div>

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative w-full sm:max-w-sm">
            <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search tasks" className="pl-8" />
          </div>

          <Button variant="outline">
            <FilterIcon className="size-4" />
            Filter
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          {taskCount} work item{taskCount === 1 ? "" : "s"} visible
        </p>
      </div>
    </div>
  );
};
