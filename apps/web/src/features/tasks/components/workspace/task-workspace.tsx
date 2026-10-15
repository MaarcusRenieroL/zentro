"use client";

import { useMemo, useState } from "react";
import { CalendarDaysIcon, Columns3Icon, ListIcon } from "lucide-react";

import { cn } from "@zentro/ui/lib/utils";

import { CalendarView } from "./calendar-view";
import { ListView } from "./list-view";
import { TaskBoard } from "./task-board";
import {
  TaskWorkspaceHeader,
  type TaskGroup,
  type TaskSort,
  type TaskView,
} from "./task-workspace-header";
import type {
  TaskPriority,
  TaskStatus,
  WorkspaceTask,
} from "~/src/features/tasks/lib/types";
import { FC } from "react";

type Props = {
  title: string;
  tasks: WorkspaceTask[];
  // Only tasks of this project are shown (from /tasks?project=<slug>).
  projectSlug?: string;
  initialStatus?: TaskStatus | "all";
  onTaskStatusChange?: (task: WorkspaceTask, status: TaskStatus) => void;
  onTasksStatusChange?: (tasks: WorkspaceTask[], status: TaskStatus) => void;
  onTaskCreated?: () => void | Promise<void>;
};

export const TaskWorkspace: FC<Props> = ({
  title,
  tasks,
  projectSlug,
  initialStatus = "all",
  onTaskStatusChange,
  onTasksStatusChange,
  onTaskCreated,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">(
    initialStatus,
  );
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">(
    "all",
  );
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [teamFilter, setTeamFilter] = useState("all");
  const [group, setGroup] = useState<TaskGroup>("state");
  const [sort, setSort] = useState<TaskSort>("due");
  const [view, setView] = useState<TaskView>("list");

  const assigneeOptions = useMemo(() => {
    return Array.from(new Set(tasks.map((task) => task.assignee))).sort(
      (a, b) => a.localeCompare(b),
    );
  }, [tasks]);

  const teamOptions = useMemo(() => {
    const options = new Map<string, string>();

    tasks.forEach((task) => {
      if (task.teamId && task.teamName) {
        options.set(task.teamId, task.teamName);
      }
    });

    return Array.from(options, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesProject = !projectSlug || task.projectSlug === projectSlug;
      const matchesSearch =
        !normalizedSearch ||
        [
          task.key,
          task.title,
          task.description,
          task.projectName,
          task.teamName ?? "",
          task.assignee,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);
      const matchesStatus =
        statusFilter === "all" || task.status === statusFilter;
      const matchesPriority =
        priorityFilter === "all" || task.priority === priorityFilter;
      const matchesAssignee =
        assigneeFilter === "all" || task.assignee === assigneeFilter;
      const matchesTeam =
        teamFilter === "all" ||
        (teamFilter === "workspace" && !task.teamId) ||
        task.teamId === teamFilter;

      return (
        matchesProject &&
        matchesSearch &&
        matchesStatus &&
        matchesPriority &&
        matchesAssignee &&
        matchesTeam
      );
    });
  }, [
    assigneeFilter,
    priorityFilter,
    projectSlug,
    searchQuery,
    statusFilter,
    tasks,
    teamFilter,
  ]);

  const filtersActive =
    Boolean(searchQuery.trim()) ||
    statusFilter !== "all" ||
    priorityFilter !== "all" ||
    assigneeFilter !== "all" ||
    teamFilter !== "all";

  const views = [
    { value: "list", label: "List", Icon: ListIcon },
    { value: "board", label: "Board", Icon: Columns3Icon },
    { value: "calendar", label: "Calendar", Icon: CalendarDaysIcon },
  ] as const;

  return (
    <section className="flex w-full flex-col">
      <TaskWorkspaceHeader
        title={title}
        taskCount={filteredTasks.length}
        totalCount={tasks.length}
        projectScoped={Boolean(projectSlug)}
        assigneeOptions={assigneeOptions}
        teamOptions={teamOptions}
        filtersActive={filtersActive}
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        priorityFilter={priorityFilter}
        assigneeFilter={assigneeFilter}
        teamFilter={teamFilter}
        group={group}
        sort={sort}
        view={view}
        viewControl={
          <div
            role="radiogroup"
            aria-label="View"
            className="flex gap-0.5 rounded-xl border border-hairline bg-surface p-[3px]"
          >
            {views.map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={view === value}
                onClick={() => setView(value)}
                className={cn(
                  "flex h-[26px] items-center gap-1.5 rounded-[9px] px-2.5 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  view === value
                    ? "bg-ink text-ink-inverse"
                    : "text-ink-2 hover:text-ink",
                )}
              >
                <Icon className="size-3.5" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        }
        onSearchQueryChange={setSearchQuery}
        onStatusFilterChange={setStatusFilter}
        onPriorityFilterChange={setPriorityFilter}
        onAssigneeFilterChange={setAssigneeFilter}
        onTeamFilterChange={setTeamFilter}
        onGroupChange={setGroup}
        onSortChange={setSort}
        onTaskCreated={onTaskCreated}
        onClearFilters={() => {
          setSearchQuery("");
          setStatusFilter("all");
          setPriorityFilter("all");
          setAssigneeFilter("all");
          setTeamFilter("all");
        }}
      />

      <div className="min-w-0">
        {view === "board" ? (
          <TaskBoard
            tasks={filteredTasks}
            onTaskStatusChange={onTaskStatusChange}
            onTaskCreated={onTaskCreated}
          />
        ) : null}
        {view === "list" ? (
          <ListView
            tasks={filteredTasks}
            group={group}
            sort={sort}
            onTasksStatusChange={onTasksStatusChange}
          />
        ) : null}
        {view === "calendar" ? <CalendarView tasks={filteredTasks} /> : null}
      </div>
    </section>
  );
};
