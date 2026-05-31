"use client";

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
import { WorkLogEvent, WorkspaceTask } from "~/src/lib/types";
import { FC } from "react";

type Props = {
  title: string;
  description: string;
  tasks: WorkspaceTask[];
  logs: WorkLogEvent[];
  projectScoped?: boolean;
};

export const TaskWorkspace: FC<Props> = ({
  title,
  description,
  tasks,
  logs,
  projectScoped = false,
}) => {
  return (
    <section className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8 xl:px-10">
      <TaskWorkspaceHeader
        title={title}
        description={description}
        taskCount={tasks.length}
        projectScoped={projectScoped}
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
            <TaskBoard tasks={tasks} />
          </TabsContent>

          <TabsContent value="list" className="mt-0">
            <ListView tasks={tasks} />
          </TabsContent>

          <TabsContent value="calendar" className="mt-0">
            <CalendarView tasks={tasks} />
          </TabsContent>

          <TabsContent value="timeline" className="mt-0">
            <WorklogPlanner tasks={tasks} logs={logs} />
          </TabsContent>
        </div>
      </Tabs>
    </section>
  );
};
