"use client";

import { useMemo, useState } from "react";
import { CalendarDaysIcon, Columns3Icon, ListIcon } from "lucide-react";

import { cn } from "@zentro/ui/lib/utils";
import { useSidebar } from "@zentro/ui/shadcn/sidebar";

import { useCurrentUserId } from "~/src/components/permissions/permission-provider";

import { CalendarView } from "./calendar-view";
import { EmptyTasks } from "./empty-tasks";
import { ListView } from "./list-view";
import { TaskBoard } from "./task-board";
import {
  TaskWorkspaceHeader,
  savedViewLabels,
  type SavedView,
  type TaskGroup,
  type TaskSort,
  type TaskView,
} from "./task-workspace-header";
import type {
  BulkChange,
  TaskPriority,
  TaskStatus,
  WorkspaceTask,
} from "~/src/features/tasks/lib/types";
import { FC } from "react";
import { statusLabels } from "~/src/features/tasks/lib/constants";

type Props = {
  title: string;
  tasks: WorkspaceTask[];
  // Only tasks of this project are shown (from /tasks?project=<slug>).
  projectSlug?: string;
  initialStatus?: TaskStatus | "all";
  onTaskStatusChange?: (task: WorkspaceTask, status: TaskStatus) => void;
  onTasksChange?: (tasks: WorkspaceTask[], change: BulkChange) => void;
  onTasksDelete?: (tasks: WorkspaceTask[]) => void;
  onTaskCreated?: () => void | Promise<void>;
};

export const TaskWorkspace: FC<Props> = ({
  title,
  tasks,
  projectSlug,
  initialStatus = "all",
  onTaskStatusChange,
  onTasksChange,
  onTasksDelete,
  onTaskCreated,
}) => {
  const userId = useCurrentUserId();
  const { isMobile } = useSidebar();
  const [savedView, setSavedView] = useState<SavedView>("all");
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
  const [chosenView, setView] = useState<TaskView>("list");
  // Phones get the list only; board and calendar need the width.
  const view = isMobile ? "list" : chosenView;

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
    const weekEnd = new Date();

    weekEnd.setHours(23, 59, 59, 999);
    weekEnd.setDate(weekEnd.getDate() + ((7 - weekEnd.getDay()) % 7));

    return tasks.filter((task) => {
      const matchesView =
        savedView === "all" ||
        (savedView === "mine"
          ? task.assigneeUserId === userId && task.status !== "done"
          : task.status !== "done" &&
            Boolean(task.dueAt) &&
            new Date(task.dueAt!).getTime() <= weekEnd.getTime());
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
        matchesView &&
        matchesProject &&
        matchesSearch &&
        matchesStatus &&
        matchesPriority &&
        matchesAssignee &&
        matchesTeam
      );
    });
  }, [
    savedView,
    userId,
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

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setAssigneeFilter("all");
    setTeamFilter("all");
  };
  // What the filters ask for, in words, for the empty state.
  const filterSummary = [
    statusFilter !== "all" ? statusLabels[statusFilter].toLowerCase() : null,
    assigneeFilter !== "all" ? `assigned to ${assigneeFilter}` : null,
    teamFilter !== "all"
      ? teamFilter === "workspace"
        ? "outside a team"
        : `on the ${teamOptions.find((team) => team.id === teamFilter)?.name ?? "chosen"} team`
      : null,
    priorityFilter !== "all" ? `${priorityFilter} priority` : null,
    searchQuery.trim() ? `matching “${searchQuery.trim()}”` : null,
    savedView !== "all" ? `in ${savedViewLabels[savedView]}` : null,
  ].filter(Boolean);
  const empty =
    tasks.length && (filtersActive || savedView !== "all") ? (
      <EmptyTasks
        filtered={{
          summary: filterSummary.length
            ? filterSummary.join(", ")
            : "in this view",
          total: tasks.length,
          onClear: () => {
            clearFilters();
            setSavedView("all");
          },
        }}
      />
    ) : undefined;

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
        savedView={savedView}
        onSavedViewChange={setSavedView}
        compact={isMobile}
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
        onClearFilters={clearFilters}
      />

      <div className="min-w-0">
        {view === "board" ? (
          <TaskBoard
            tasks={filteredTasks}
            onTaskStatusChange={onTaskStatusChange}
            onTaskCreated={onTaskCreated}
            empty={empty}
          />
        ) : null}
        {view === "list" ? (
          <ListView
            tasks={filteredTasks}
            group={group}
            sort={sort}
            onTasksChange={onTasksChange}
            onTasksDelete={onTasksDelete}
            onTaskCreated={onTaskCreated}
            empty={empty}
          />
        ) : null}
        {view === "calendar" ? <CalendarView tasks={filteredTasks} /> : null}
      </div>
    </section>
  );
};
