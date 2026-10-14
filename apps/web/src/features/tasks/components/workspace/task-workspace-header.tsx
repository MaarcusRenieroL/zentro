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
import type { TaskPriority, TaskStatus } from "~/src/features/tasks/lib/types";

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
  const trigger =
    "h-(--control-h) w-full rounded-full border-transparent bg-sunken shadow-none hover:bg-hover sm:w-auto sm:min-w-32";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {projectScoped ? (
            <p className="text-sm font-medium text-signal">Project tasks</p>
          ) : null}

          <h1 className="mt-1 font-display text-(length:--title-size) leading-[1.05] tracking-tight text-ink">
            {title}
          </h1>

          <p className="mt-1.5 max-w-2xl text-sm text-ink-2">{description}</p>
        </div>

        <CreateTaskModal onTaskCreated={onTaskCreated} />
      </div>

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative w-full sm:max-w-xs">
            <SearchIcon className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
            <Input
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
              placeholder="Search tasks"
              className="rounded-full border-transparent bg-sunken pl-9 shadow-none"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(value) =>
              onStatusFilterChange(value as TaskStatus | "all")
            }
          >
            <SelectTrigger className={trigger}>
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
            <SelectTrigger className={trigger}>
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
            <SelectTrigger className={trigger}>
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
            <SelectTrigger className={trigger}>
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
            variant="ghost"
            className="rounded-full"
            disabled={!filtersActive}
            onClick={onClearFilters}
          >
            <RotateCcwIcon className="size-4" />
            Clear
          </Button>
        </div>

        <p className="text-sm text-ink-2">
          {taskCount} work item{taskCount === 1 ? "" : "s"} visible
        </p>
      </div>
    </div>
  );
};
