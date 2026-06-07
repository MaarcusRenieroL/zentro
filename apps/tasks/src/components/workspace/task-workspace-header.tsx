import { RotateCcwIcon, SearchIcon } from "lucide-react";

import { Button } from "@zentro/ui/shadcn/button";
import { Input } from "@zentro/ui/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zentro/ui/shadcn/select";
import { FC } from "react";
import { CreateTaskModal } from "../create-task-modal";
import type { TaskPriority, TaskStatus } from "~/src/lib/types";

const allValue = "__all__";

type Props = {
  title: string;
  description: string;
  taskCount: number;
  projectScoped?: boolean;
  assigneeOptions: string[];
  teamOptions: Array<{ id: string; name: string }>;
  filtersActive: boolean;
  searchQuery: string;
  statusFilter: TaskStatus | "all";
  priorityFilter: TaskPriority | "all";
  assigneeFilter: string;
  teamFilter: string;
  onSearchQueryChange: (value: string) => void;
  onStatusFilterChange: (value: TaskStatus | "all") => void;
  onPriorityFilterChange: (value: TaskPriority | "all") => void;
  onAssigneeFilterChange: (value: string) => void;
  onTeamFilterChange: (value: string) => void;
  onClearFilters: () => void;
  onTaskCreated?: () => void | Promise<void>;
};

export const TaskWorkspaceHeader: FC<Props> = ({
  title,
  description,
  taskCount,
  projectScoped = false,
  assigneeOptions,
  teamOptions,
  filtersActive,
  searchQuery,
  statusFilter,
  priorityFilter,
  assigneeFilter,
  teamFilter,
  onSearchQueryChange,
  onStatusFilterChange,
  onPriorityFilterChange,
  onAssigneeFilterChange,
  onTeamFilterChange,
  onClearFilters,
  onTaskCreated,
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

        <CreateTaskModal onTaskCreated={onTaskCreated} />
      </div>

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative w-full sm:max-w-sm">
            <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
              placeholder="Search tasks"
              className="pl-8"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(value) =>
              onStatusFilterChange(value as TaskStatus | "all")
            }
          >
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="backlog">Backlog</SelectItem>
              <SelectItem value="todo">To do</SelectItem>
              <SelectItem value="in-progress">In progress</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={priorityFilter}
            onValueChange={(value) =>
              onPriorityFilterChange(value as TaskPriority | "all")
            }
          >
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={assigneeFilter === "all" ? allValue : assigneeFilter}
            onValueChange={(value) =>
              onAssigneeFilterChange(value === allValue ? "all" : value)
            }
          >
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={allValue}>All assignees</SelectItem>
              {assigneeOptions.map((assignee) => (
                <SelectItem key={assignee} value={assignee}>
                  {assignee}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={teamFilter} onValueChange={onTeamFilterChange}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Team" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All teams</SelectItem>
              <SelectItem value="workspace">Workspace level</SelectItem>
              {teamOptions.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            disabled={!filtersActive}
            onClick={onClearFilters}
          >
            <RotateCcwIcon className="size-4" />
            Clear
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          {taskCount} work item{taskCount === 1 ? "" : "s"} visible
        </p>
      </div>
    </div>
  );
};
