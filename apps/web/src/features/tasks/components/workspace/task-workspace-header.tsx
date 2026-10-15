import { ArrowDownUpIcon, LayersIcon, SearchIcon } from "lucide-react";
import { FC, type ReactNode } from "react";

import { cn } from "@zentro/ui/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zentro/ui/shadcn/select";

import { ModuleTabs } from "~/src/components/shell/module-section-nav";
import type { TaskPriority, TaskStatus } from "~/src/features/tasks/lib/types";
import { paths } from "~/src/lib/paths";

import { CreateTaskModal } from "../create-task-modal";

const allValue = "__all__";

export type TaskGroup = "state" | "priority" | "project" | "assignee" | "none";
export type TaskSort = "due" | "priority" | "key" | "title";
export type TaskView = "list" | "board" | "calendar";

export const groupLabels: Record<TaskGroup, string> = {
  state: "State",
  priority: "Priority",
  project: "Project",
  assignee: "Assignee",
  none: "None",
};

export const sortLabels: Record<TaskSort, string> = {
  due: "Due date",
  priority: "Priority",
  key: "Newest",
  title: "Title",
};

const statusNames: Record<string, string> = {
  backlog: "Backlog",
  todo: "To do",
  "in-progress": "In progress",
  review: "Review",
  done: "Done",
};

type Props = {
  title: string;
  taskCount: number;
  totalCount: number;
  projectScoped?: boolean;
  assigneeOptions: string[];
  teamOptions: Array<{ id: string; name: string }>;
  filtersActive: boolean;
  searchQuery: string;
  statusFilter: TaskStatus | "all";
  priorityFilter: TaskPriority | "all";
  assigneeFilter: string;
  teamFilter: string;
  group: TaskGroup;
  sort: TaskSort;
  view: TaskView;
  viewControl: ReactNode;
  onSearchQueryChange: (value: string) => void;
  onStatusFilterChange: (value: TaskStatus | "all") => void;
  onPriorityFilterChange: (value: TaskPriority | "all") => void;
  onAssigneeFilterChange: (value: string) => void;
  onTeamFilterChange: (value: string) => void;
  onGroupChange: (value: TaskGroup) => void;
  onSortChange: (value: TaskSort) => void;
  onClearFilters: () => void;
  onTaskCreated?: () => void | Promise<void>;
};

/** One filter as a 32px chip: its name, then its value once it is set. */
function FilterChip({
  label,
  active,
  value,
  onValueChange,
  display,
  children,
  icon,
  ariaLabel,
  showValue = false,
}: {
  label: string;
  active: boolean;
  value: string;
  onValueChange: (value: string) => void;
  display: string;
  children: ReactNode;
  icon?: ReactNode;
  ariaLabel?: string;
  showValue?: boolean;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        aria-label={ariaLabel ?? label}
        className={cn(
          "h-8 shrink-0 gap-1.5 rounded-xl border-hairline bg-transparent px-2.5 text-[13px] shadow-none data-[size=default]:h-8",
          active && "border-signal/40 bg-signal-subtle",
        )}
      >
        {icon}
        <span className="text-ink-3">{label}</span>
        <SelectValue>
          {/* A filter shows its value only once it is set. */}
          {active || showValue ? (
            <span className="font-medium text-ink">{display}</span>
          ) : null}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
  );
}

export const TaskWorkspaceHeader: FC<Props> = ({
  title,
  taskCount,
  totalCount,
  projectScoped = false,
  assigneeOptions,
  teamOptions,
  filtersActive,
  searchQuery,
  statusFilter,
  priorityFilter,
  assigneeFilter,
  teamFilter,
  group,
  sort,
  viewControl,
  onSearchQueryChange,
  onStatusFilterChange,
  onPriorityFilterChange,
  onAssigneeFilterChange,
  onTeamFilterChange,
  onGroupChange,
  onSortChange,
  onClearFilters,
  onTaskCreated,
}) => {
  const teamName =
    teamFilter === "all"
      ? "All"
      : teamFilter === "workspace"
        ? "Workspace"
        : (teamOptions.find((team) => team.id === teamFilter)?.name ?? "All");

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-center gap-3">
        {projectScoped ? <p className="eyebrow w-full">Project tasks</p> : null}
        <h1 className="font-display text-[length:var(--title-size)] leading-[1.1]">
          {title}
        </h1>
        <span className="flex-1" />
        <CreateTaskModal onTaskCreated={onTaskCreated} />
      </div>

      <ModuleTabs className="mt-4" counts={{ [paths.tasks()]: totalCount }} />

      <div className="mt-3.5 mb-3 flex flex-wrap items-center gap-2">
        <div className="relative h-8 w-full min-w-0 sm:w-60">
          <SearchIcon
            aria-hidden="true"
            className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-3"
          />
          <input
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder="Filter by title or key"
            aria-label="Filter tasks"
            className="h-full w-full rounded-xl border border-hairline bg-surface pr-2.5 pl-8 text-[13px] outline-none placeholder:text-ink-3 focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/22"
          />
        </div>

        <FilterChip
          label="Status"
          active={statusFilter !== "all"}
          value={statusFilter}
          display={statusFilter === "all" ? "All" : statusNames[statusFilter]!}
          onValueChange={(value) =>
            onStatusFilterChange(value as TaskStatus | "all")
          }
        >
          <SelectItem value="all">All statuses</SelectItem>
          {Object.entries(statusNames).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </FilterChip>

        <FilterChip
          label="Priority"
          active={priorityFilter !== "all"}
          value={priorityFilter}
          display={
            priorityFilter === "all"
              ? "All"
              : priorityFilter.charAt(0).toUpperCase() + priorityFilter.slice(1)
          }
          onValueChange={(value) =>
            onPriorityFilterChange(value as TaskPriority | "all")
          }
        >
          <SelectItem value="all">All priorities</SelectItem>
          <SelectItem value="low">Low</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="high">High</SelectItem>
        </FilterChip>

        <FilterChip
          label="Assignee"
          active={assigneeFilter !== "all"}
          value={assigneeFilter === "all" ? allValue : assigneeFilter}
          display={assigneeFilter === "all" ? "All" : assigneeFilter}
          onValueChange={(value) =>
            onAssigneeFilterChange(value === allValue ? "all" : value)
          }
        >
          <SelectItem value={allValue}>All assignees</SelectItem>
          {assigneeOptions.map((assignee) => (
            <SelectItem key={assignee} value={assignee}>
              {assignee}
            </SelectItem>
          ))}
        </FilterChip>

        <FilterChip
          label="Team"
          active={teamFilter !== "all"}
          value={teamFilter}
          display={teamName}
          onValueChange={onTeamFilterChange}
        >
          <SelectItem value="all">All teams</SelectItem>
          <SelectItem value="workspace">Workspace level</SelectItem>
          {teamOptions.map((team) => (
            <SelectItem key={team.id} value={team.id}>
              {team.name}
            </SelectItem>
          ))}
        </FilterChip>

        {filtersActive ? (
          <button
            type="button"
            onClick={onClearFilters}
            className="h-8 rounded-xl px-2 text-[13px] text-ink-2 outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-ring"
          >
            Clear
          </button>
        ) : null}
        <span className="font-mono text-xs text-ink-3">
          {taskCount} {taskCount === 1 ? "task" : "tasks"}
        </span>

        <span className="flex-1" />

        <FilterChip
          label="Group"
          icon={<LayersIcon className="size-3.5" aria-hidden="true" />}
          showValue
          active={false}
          value={group}
          display={groupLabels[group]}
          onValueChange={(value) => onGroupChange(value as TaskGroup)}
        >
          {Object.entries(groupLabels).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </FilterChip>

        <FilterChip
          label="Sort"
          icon={<ArrowDownUpIcon className="size-3.5" aria-hidden="true" />}
          showValue
          active={false}
          value={sort}
          display={sortLabels[sort]}
          onValueChange={(value) => onSortChange(value as TaskSort)}
        >
          {Object.entries(sortLabels).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </FilterChip>

        {viewControl}
      </div>
    </div>
  );
};
