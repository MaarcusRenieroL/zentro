"use client";

import { FC, useMemo, useState } from "react";
import { CalendarDaysIcon, DownloadIcon, RefreshCwIcon } from "lucide-react";

import {
  DataTable,
  type DataTableColumnDef,
} from "@zentro/ui/components/data-table";
import { Badge } from "@zentro/ui/shadcn/badge";
import { Button } from "@zentro/ui/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@zentro/ui/shadcn/card";
import { Input } from "@zentro/ui/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zentro/ui/shadcn/select";
import { cn } from "@zentro/ui/lib/utils";

import { LogWorkDialog } from "./log-work-dialog";
import {
  getAssignments,
  getLoggedRows,
  getVisibleDays,
  LoggedHoursRow,
  Period,
} from "~/src/lib/utils";
import { WorkLogEvent, WorkspaceTask } from "~/src/lib/types";

const loggedHourColumns: DataTableColumnDef<LoggedHoursRow>[] = [
  {
    accessorKey: "date",
    header: "Date",
    meta: { label: "Date" },
  },
  {
    accessorKey: "task",
    header: "Task",
    meta: { label: "Task", className: "min-w-72" },
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.task}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {row.original.project}
        </p>
      </div>
    ),
  },
  {
    accessorKey: "category",
    header: "Category",
    meta: { label: "Category" },
  },
  {
    accessorKey: "duration",
    header: "Time spent",
    meta: { label: "Time spent" },
    cell: ({ row }) => (
      <Badge variant="secondary">{row.original.duration}</Badge>
    ),
  },
  {
    accessorKey: "comment",
    header: "Comment",
    meta: { label: "Comment", className: "min-w-64" },
  },
];

type Props = {
  tasks: WorkspaceTask[];
  logs: WorkLogEvent[];
};

export const WorklogPlanner: FC<Props> = ({ tasks, logs }) => {
  const [period, setPeriod] = useState<Period>("2-weeks");
  const [issueSearch, setIssueSearch] = useState("");

  const visibleDays = getVisibleDays(period);
  const filteredTasks = useMemo(() => {
    const normalizedSearch = issueSearch.trim().toLowerCase();

    if (!normalizedSearch) {
      return tasks;
    }

    return tasks.filter((task) =>
      [task.key, task.title, task.description, task.projectName, task.assignee]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [issueSearch, tasks]);
  const filteredTaskIds = useMemo(
    () => new Set(filteredTasks.map((task) => task.id)),
    [filteredTasks],
  );
  const assignments = getAssignments(filteredTasks, visibleDays);
  const loggedRows = getLoggedRows(
    logs.filter((log) => filteredTaskIds.has(log.taskId)),
  );

  const totalCapacity = visibleDays.reduce(
    (total, day) => total + day.capacity,
    0,
  );

  const totalLogged = visibleDays.reduce((total, day) => total + day.logged, 0);

  const utilization = totalCapacity
    ? Math.round((totalLogged / totalCapacity) * 100)
    : 0;

  function resetPlanner() {
    setPeriod("2-weeks");
    setIssueSearch("");
  }

  function exportLoggedRows() {
    const headers = [
      "Date",
      "Task",
      "Project",
      "Category",
      "Duration",
      "Comment",
    ];
    const rows = loggedRows.map((row) => [
      row.date,
      row.task,
      row.project,
      row.category,
      row.duration,
      row.comment,
    ]);
    const csv = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","),
      )
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");

    link.href = url;
    link.download = "zentro-worklog.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card className="rounded-lg">
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="text-base">Workspace timeline</CardTitle>
            <CardDescription>
              Plan work, log hours, and review capacity across the workspace.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={period}
              onValueChange={(value) => setPeriod(value as Period)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="2-weeks">2 weeks</SelectItem>
                <SelectItem value="3-weeks">3 weeks</SelectItem>
              </SelectContent>
            </Select>

            <LogWorkDialog tasks={tasks} />

            <Button variant="outline" onClick={resetPlanner}>
              <RefreshCwIcon className="size-4" />
              Reset
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="rounded-lg border bg-background p-3">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Planner</p>
                <p className="text-xs text-muted-foreground">General</p>
              </div>

              <CalendarDaysIcon className="size-4 text-muted-foreground" />
            </div>

            <Input
              placeholder="Search issues"
              value={issueSearch}
              onChange={(event) => setIssueSearch(event.target.value)}
            />

            <div className="mt-4 space-y-2">
              {filteredTasks.slice(0, 6).map((task) => (
                <div
                  key={task.id}
                  className="rounded-md border bg-muted/35 p-2 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium">{task.key}</span>
                    <Badge variant="outline">{task.logged}</Badge>
                  </div>

                  <p className="mt-1 line-clamp-2 text-muted-foreground">
                    {task.title}
                  </p>
                </div>
              ))}

              {!filteredTasks.length ? (
                <div className="rounded-md border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
                  No issues match this search.
                </div>
              ) : null}
            </div>
          </aside>

          <div className="min-w-0 space-y-4">
            <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
              <Card className="rounded-lg">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex size-24 shrink-0 items-center justify-center rounded-full border-[12px] border-primary/70 border-r-muted">
                    <div className="text-center">
                      <p className="text-xl font-semibold">{utilization}%</p>
                      <p className="text-xs text-muted-foreground">
                        {totalLogged}h/{totalCapacity}h
                      </p>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-medium">Capacity</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Logged hours against available work capacity.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-lg">
                <CardContent className="p-4">
                  <div
                    className="grid h-28 items-end gap-2"
                    style={{
                      gridTemplateColumns: `repeat(${visibleDays.length}, minmax(28px, 1fr))`,
                    }}
                  >
                    {visibleDays.map((day) => {
                      const height = day.capacity
                        ? Math.max((day.logged / day.capacity) * 100, 8)
                        : 4;

                      return (
                        <div
                          key={day.date}
                          className="flex flex-col items-center gap-2"
                        >
                          <div className="flex h-20 w-full items-end rounded-sm bg-muted">
                            <div
                              className={cn(
                                "w-full rounded-sm",
                                day.logged > day.capacity
                                  ? "bg-red-500/70"
                                  : day.logged >= day.capacity / 2
                                    ? "bg-emerald-500/70"
                                    : "bg-amber-500/70",
                              )}
                              style={{ height: `${height}%` }}
                            />
                          </div>

                          <span className="truncate text-[10px] text-muted-foreground">
                            {day.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="overflow-x-auto rounded-lg border">
              <div
                className="min-w-[980px]"
                style={{
                  width: `${Math.max(visibleDays.length * 150, 980)}px`,
                }}
              >
                <div
                  className="grid border-b bg-muted/40"
                  style={{
                    gridTemplateColumns: `repeat(${visibleDays.length}, minmax(150px, 1fr))`,
                  }}
                >
                  {visibleDays.map((day) => (
                    <div
                      key={day.date}
                      className="border-r p-2 last:border-r-0"
                    >
                      <p className="text-sm font-medium">{day.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {day.date}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="relative min-h-[420px] bg-background">
                  <div
                    className="absolute inset-0 grid"
                    style={{
                      gridTemplateColumns: `repeat(${visibleDays.length}, minmax(150px, 1fr))`,
                    }}
                  >
                    {visibleDays.map((day) => (
                      <div
                        key={day.date}
                        className="border-r last:border-r-0"
                      />
                    ))}
                  </div>

                  {assignments.map((assignment, rowIndex) => (
                    <div
                      key={assignment.id}
                      className="absolute left-0 right-0"
                      style={{ top: `${24 + rowIndex * 56}px` }}
                    >
                      <div
                        className="absolute rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-2 text-primary shadow-xs"
                        style={{
                          left: `${(assignment.dayIndex / visibleDays.length) * 100}%`,
                          width: `${(Math.min(assignment.span, visibleDays.length - assignment.dayIndex) / visibleDays.length) * 100}%`,
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-xs font-medium">
                            {assignment.taskId} {assignment.title}
                          </p>

                          <Badge variant="secondary">
                            {assignment.plannedHours}h
                          </Badge>
                        </div>

                        <p className="mt-1 truncate text-[11px] opacity-75">
                          {assignment.assignee} · {assignment.projectName}
                        </p>
                      </div>
                    </div>
                  ))}

                  {!assignments.length ? (
                    <div className="absolute inset-0 flex items-center justify-center px-4 text-center">
                      <div>
                        <CalendarDaysIcon className="mx-auto mb-3 size-8 text-muted-foreground" />
                        <p className="text-sm font-medium">No planned work</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Adjust the issue search to bring tasks back into the
                          timeline.
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Logged hours</h2>
              <p className="text-sm text-muted-foreground">
                Review the detailed work logs for the selected period.
              </p>
            </div>

            <Button variant="outline" onClick={exportLoggedRows}>
              <DownloadIcon className="size-4" />
              Export
            </Button>
          </div>

          <DataTable
            columns={loggedHourColumns}
            data={loggedRows}
            filterPlaceholder="Search work logs..."
            getRowId={(row) => row.id}
            searchColumn="task"
            showPagination={false}
            showRowSelection={false}
          />
        </section>
      </CardContent>
    </Card>
  );
};
