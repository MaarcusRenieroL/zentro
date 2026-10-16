"use client";

import {
  useMemo,
  useState,
  type DragEvent,
  type FC,
  type ReactNode,
} from "react";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  PlusIcon,
  UserIcon,
} from "lucide-react";

import { PriorityGlyph, StatusGlyph } from "@zentro/ui/components/status-glyph";
import { cn } from "@zentro/ui/lib/utils";

import { ActorAvatar } from "~/src/components/actor-avatar";
import { statusLabels } from "~/src/features/tasks/lib/constants";
import type { TaskStatus, WorkspaceTask } from "~/src/features/tasks/lib/types";
import { CreateTaskModal } from "../create-task-modal";
import { EmptyTasks } from "./empty-tasks";
import { TaskCard } from "./task-card";
import type { TaskGroup } from "./task-workspace-header";

// Work in motion first, finished work last with a few cards. Backlog only
// gets a column while something is parked in it.
const columns: TaskStatus[] = [
  "in-progress",
  "review",
  "todo",
  "backlog",
  "done",
];
const doneVisible = 3;

type Props = {
  tasks: WorkspaceTask[];
  group?: TaskGroup;
  onTaskStatusChange?: (task: WorkspaceTask, status: TaskStatus) => void;
  onTaskCreated?: () => void | Promise<void>;
  empty?: ReactNode;
};

type Swimlane = {
  id: string;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  tasks: WorkspaceTask[];
  totalPoints: number;
};

export const TaskBoard: FC<Props> = ({
  tasks,
  group = "state",
  onTaskStatusChange,
  onTaskCreated,
  empty,
}) => {
  const [showAllDone, setShowAllDone] = useState(false);
  const [collapsedLanes, setCollapsedLanes] = useState<Record<string, boolean>>(
    {},
  );

  if (!tasks.length) return empty ?? <EmptyTasks />;

  const shown = columns.filter(
    (status) =>
      status !== "backlog" || tasks.some((task) => task.status === status),
  );

  function handleDrop(event: DragEvent<HTMLElement>, status: TaskStatus) {
    event.preventDefault();

    const taskId = event.dataTransfer.getData("text/plain");
    const task = tasks.find((candidate) => candidate.id === taskId);

    if (!task || task.status === status) {
      return;
    }

    onTaskStatusChange?.(task, status);
  }

  const toggleLane = (laneId: string) => {
    setCollapsedLanes((prev) => ({
      ...prev,
      [laneId]: !prev[laneId],
    }));
  };

  const isSwimlaneMode =
    group === "assignee" || group === "priority" || group === "project";

  const swimlanes: Swimlane[] = useMemo(() => {
    if (!isSwimlaneMode) return [];

    if (group === "assignee") {
      const map = new Map<string, WorkspaceTask[]>();
      const unassignedTasks: WorkspaceTask[] = [];

      for (const t of tasks) {
        if (!t.assignee || t.assignee.toLowerCase() === "unassigned") {
          unassignedTasks.push(t);
        } else {
          const list = map.get(t.assignee) ?? [];
          list.push(t);
          map.set(t.assignee, list);
        }
      }

      const lanes: Swimlane[] = [];
      const sortedAssignees = Array.from(map.keys()).sort((a, b) =>
        a.localeCompare(b),
      );

      for (const assignee of sortedAssignees) {
        const laneTasks = map.get(assignee) ?? [];
        lanes.push({
          id: `assignee-${assignee}`,
          title: assignee,
          icon: <ActorAvatar name={assignee} size={20} />,
          tasks: laneTasks,
          totalPoints: laneTasks.reduce(
            (acc, t) => acc + (t.estimatePoints ?? 0),
            0,
          ),
        });
      }

      if (unassignedTasks.length > 0) {
        lanes.push({
          id: "assignee-unassigned",
          title: "Unassigned",
          icon: (
            <div className="flex size-5 items-center justify-center rounded-full bg-surface-subtle border border-hairline text-ink-3">
              <UserIcon className="size-3" />
            </div>
          ),
          tasks: unassignedTasks,
          totalPoints: unassignedTasks.reduce(
            (acc, t) => acc + (t.estimatePoints ?? 0),
            0,
          ),
        });
      }

      return lanes;
    }

    if (group === "priority") {
      const priorities: Array<{
        id: "high" | "medium" | "low";
        label: string;
      }> = [
        { id: "high", label: "Urgent / High" },
        { id: "medium", label: "Medium Priority" },
        { id: "low", label: "Low Priority" },
      ];

      return priorities.map(({ id, label }) => {
        const laneTasks = tasks.filter((t) => t.priority === id);
        return {
          id: `priority-${id}`,
          title: label,
          icon: <PriorityGlyph priority={id} size={15} decorative />,
          tasks: laneTasks,
          totalPoints: laneTasks.reduce(
            (acc, t) => acc + (t.estimatePoints ?? 0),
            0,
          ),
        };
      });
    }

    if (group === "project") {
      const map = new Map<string, WorkspaceTask[]>();
      for (const t of tasks) {
        const projName = t.projectName || "General";
        const list = map.get(projName) ?? [];
        list.push(t);
        map.set(projName, list);
      }

      const lanes: Swimlane[] = [];
      const sortedProjects = Array.from(map.keys()).sort((a, b) =>
        a.localeCompare(b),
      );

      for (const proj of sortedProjects) {
        const laneTasks = map.get(proj) ?? [];
        lanes.push({
          id: `project-${proj}`,
          title: proj,
          icon: (
            <span className="flex size-5 items-center justify-center rounded bg-tint-projects font-mono text-[9px] font-semibold text-ink">
              {proj.charAt(0).toUpperCase()}
            </span>
          ),
          tasks: laneTasks,
          totalPoints: laneTasks.reduce(
            (acc, t) => acc + (t.estimatePoints ?? 0),
            0,
          ),
        });
      }

      return lanes;
    }

    return [];
  }, [group, isSwimlaneMode, tasks]);

  // Swimlanes Rendering
  if (isSwimlaneMode) {
    return (
      <div className="overflow-x-auto pb-4">
        {/* Sticky Swimlane Column Headers */}
        <div
          className="sticky top-0 z-10 mb-3 grid min-w-[880px] gap-3 rounded-2xl border border-hairline/80 bg-canvas/90 px-3 py-2.5 backdrop-blur shadow-2xs dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]"
          style={{
            gridTemplateColumns: `repeat(${shown.length}, minmax(0, 1fr))`,
          }}
        >
          {shown.map((status) => {
            const count = tasks.filter((t) => t.status === status).length;
            return (
              <div key={status} className="flex items-center gap-2 px-1">
                <StatusGlyph status={status} size={13} decorative />
                <span className="text-[13px] font-semibold text-ink">
                  {statusLabels[status]}
                </span>
                <span className="rounded-full bg-surface border border-hairline px-2 py-0.5 font-mono text-[11px] font-medium text-ink-3">
                  {count}
                </span>
              </div>
            );
          })}
        </div>

        {/* Swimlane Rows */}
        <div className="flex flex-col gap-3 min-w-[880px]">
          {swimlanes.map((lane) => {
            const isCollapsed = collapsedLanes[lane.id] ?? false;

            return (
              <div
                key={lane.id}
                className="rounded-2xl border border-hairline/70 bg-surface/40 p-3 shadow-2xs transition-colors hover:border-hairline"
              >
                {/* Lane Header Bar */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleLane(lane.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleLane(lane.id);
                    }
                  }}
                  className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors cursor-pointer select-none hover:bg-hover/60"
                >
                  <span className="text-ink-3">
                    {isCollapsed ? (
                      <ChevronRightIcon className="size-4" />
                    ) : (
                      <ChevronDownIcon className="size-4" />
                    )}
                  </span>
                  {lane.icon}
                  <h3 className="text-xs font-semibold text-ink">
                    {lane.title}
                  </h3>
                  <span className="rounded-full bg-surface border border-hairline px-2 py-0.5 font-mono text-[11px] font-medium text-ink-3">
                    {lane.tasks.length}{" "}
                    {lane.tasks.length === 1 ? "task" : "tasks"}
                  </span>
                  {lane.totalPoints > 0 ? (
                    <span className="font-mono text-[10px] text-ink-3">
                      · {lane.totalPoints} pts
                    </span>
                  ) : null}

                  {/* Collapsed mini status breakdown */}
                  {isCollapsed && (
                    <div className="ml-auto flex items-center gap-2">
                      {shown.map((status) => {
                        const cnt = lane.tasks.filter(
                          (t) => t.status === status,
                        ).length;
                        if (!cnt) return null;
                        return (
                          <span
                            key={status}
                            className="flex items-center gap-1 font-mono text-[10px] text-ink-3"
                          >
                            <StatusGlyph status={status} size={10} decorative />
                            {cnt}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Expanded Lane Grid */}
                {!isCollapsed && (
                  <div
                    className="mt-2.5 grid items-start gap-3"
                    style={{
                      gridTemplateColumns: `repeat(${shown.length}, minmax(0, 1fr))`,
                    }}
                  >
                    {shown.map((status) => {
                      const laneStatusTasks = lane.tasks.filter(
                        (task) => task.status === status,
                      );

                      return (
                        <div
                          key={status}
                          aria-label={`${lane.title} - ${statusLabels[status]}`}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={(event) => handleDrop(event, status)}
                          className="flex min-h-[100px] flex-col gap-2 rounded-xl border border-hairline/40 bg-canvas/30 p-2 transition-colors hover:border-hairline"
                        >
                          {laneStatusTasks.length ? (
                            laneStatusTasks.map((task) => (
                              <div
                                key={task.id}
                                draggable={Boolean(onTaskStatusChange)}
                                onDragStart={(event) => {
                                  event.dataTransfer.effectAllowed = "move";
                                  event.dataTransfer.setData(
                                    "text/plain",
                                    task.id,
                                  );
                                }}
                              >
                                <TaskCard task={task} />
                              </div>
                            ))
                          ) : (
                            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-hairline/60 p-3 text-center text-[11px] text-ink-3/60">
                              Drop here
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Classic Board Columns
  return (
    <div className="overflow-x-auto pb-2">
      <div
        className="grid min-w-[880px] items-start gap-3"
        style={{
          gridTemplateColumns: `repeat(${shown.length}, minmax(0, 1fr))`,
        }}
      >
        {shown.map((status) => {
          const allTasks = tasks.filter((task) => task.status === status);
          const hidden =
            status === "done" && !showAllDone
              ? Math.max(allTasks.length - doneVisible, 0)
              : 0;
          const columnTasks = hidden
            ? allTasks.slice(0, doneVisible)
            : allTasks;

          return (
            <section
              key={status}
              aria-label={statusLabels[status]}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => handleDrop(event, status)}
              className="flex flex-col gap-2.5 rounded-2xl border border-hairline/70 bg-surface/40 p-3 shadow-2xs transition-colors hover:border-hairline"
            >
              <div className="flex h-8 items-center gap-2 px-1">
                <StatusGlyph status={status} size={13} decorative />
                <h2 className="text-[13px] font-semibold text-ink">
                  {statusLabels[status]}
                </h2>
                <span className="font-mono text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted/70 text-ink-3">
                  {allTasks.length}
                </span>
                <span className="flex-1" />
                <CreateTaskModal
                  defaultStatus={status}
                  onTaskCreated={onTaskCreated}
                  trigger={
                    <button
                      type="button"
                      aria-label={`Create a task in ${statusLabels[status]}`}
                      className="flex size-6 items-center justify-center rounded-md text-ink-3 transition-colors outline-none hover:bg-hover hover:text-ink focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <PlusIcon className="size-3.5" aria-hidden="true" />
                    </button>
                  }
                />
              </div>

              <div className="flex flex-col gap-2.5">
                {columnTasks.length ? (
                  columnTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable={Boolean(onTaskStatusChange)}
                      onDragStart={(event) => {
                        event.dataTransfer.effectAllowed = "move";
                        event.dataTransfer.setData("text/plain", task.id);
                      }}
                    >
                      <TaskCard task={task} />
                    </div>
                  ))
                ) : (
                  <div className="flex min-h-24 items-center justify-center rounded-md border border-dashed border-border-default px-3 text-center text-xs text-ink-3">
                    No tasks in {statusLabels[status].toLowerCase()}.
                  </div>
                )}

                {hidden ? (
                  <button
                    type="button"
                    onClick={() => setShowAllDone(true)}
                    className="self-start rounded-sm px-2 py-1 text-left font-mono text-xs text-ink-3 outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {hidden} more
                  </button>
                ) : null}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};
