"use client";

import { useMemo, useState } from "react";
import {
  CalendarDaysIcon,
  ClockIcon,
  Columns3Icon,
  ListIcon,
} from "lucide-react";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@zentro/ui/shadcn/tabs";

import { CalendarView } from "./calendar-view";
import { ListView } from "./list-view";
import { TaskBoard } from "./task-board";
import { TaskWorkspaceHeader } from "./task-workspace-header";
import { WorklogPlanner } from "./worklog-planner";
import type {
  TaskPriority,
  TaskStatus,
  WorkLogEvent,
  WorkspaceTask,
} from "~/src/lib/types";
import { FC } from "react";

type Props = {
  title: string;
  description: string;
  tasks: WorkspaceTask[];
  logs: WorkLogEvent[];
  projectScoped?: boolean;
  onTaskStatusChange?: (task: WorkspaceTask, status: TaskStatus) => void;
};

export const TaskWorkspace: FC<Props> = ({
  title,
  description,
  tasks,
  logs,
  projectScoped = false,
  onTaskStatusChange,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">(
    "all",
  );
  const [assigneeFilter, setAssigneeFilter] = useState("all");

  const assigneeOptions = useMemo(() => {
    return Array.from(new Set(tasks.map((task) => task.assignee))).sort(
      (a, b) => a.localeCompare(b),
    );
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesSearch =
        !normalizedSearch ||
        [
          task.key,
          task.title,
          task.description,
          task.projectName,
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

      return (
        matchesSearch && matchesStatus && matchesPriority && matchesAssignee
      );
    });
  }, [assigneeFilter, priorityFilter, searchQuery, statusFilter, tasks]);

  const filtersActive =
    Boolean(searchQuery.trim()) ||
    statusFilter !== "all" ||
    priorityFilter !== "all" ||
    assigneeFilter !== "all";

  return (
    <section className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8 xl:px-10">
      <TaskWorkspaceHeader
        title={title}
        description={description}
        taskCount={filteredTasks.length}
        projectScoped={projectScoped}
        assigneeOptions={assigneeOptions}
        filtersActive={filtersActive}
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        priorityFilter={priorityFilter}
        assigneeFilter={assigneeFilter}
        onSearchQueryChange={setSearchQuery}
        onStatusFilterChange={setStatusFilter}
        onPriorityFilterChange={setPriorityFilter}
        onAssigneeFilterChange={setAssigneeFilter}
        onClearFilters={() => {
          setSearchQuery("");
          setStatusFilter("all");
          setPriorityFilter("all");
          setAssigneeFilter("all");
        }}
      />

      <Tabs defaultValue="board" className="flex flex-col gap-4">
        <TabsList className="w-full justify-start overflow-x-auto sm:w-fit">
          <TabsTrigger value="board">
            <Columns3Icon className="size-4" />
            Board
          </TabsTrigger>

          <TabsTrigger value="list">
            <ListIcon className="size-4" />
            List
          </TabsTrigger>

          <TabsTrigger value="calendar">
            <CalendarDaysIcon className="size-4" />
            Calendar
          </TabsTrigger>

          <TabsTrigger value="timeline">
            <ClockIcon className="size-4" />
            Timeline
          </TabsTrigger>
        </TabsList>

        <div className="min-w-0">
          <TabsContent value="board" className="mt-0">
            <TaskBoard
              tasks={filteredTasks}
              onTaskStatusChange={onTaskStatusChange}
            />
          </TabsContent>

          <TabsContent value="list" className="mt-0">
            <ListView tasks={filteredTasks} />
          </TabsContent>

          <TabsContent value="calendar" className="mt-0">
            <CalendarView tasks={filteredTasks} />
          </TabsContent>

          <TabsContent value="timeline" className="mt-0">
            <WorklogPlanner tasks={filteredTasks} logs={logs} />
          </TabsContent>
        </div>
      </Tabs>
    </section>
  );
};
