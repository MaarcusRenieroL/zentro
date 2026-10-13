"use client";

import { FC, useEffect, useState } from "react";

import { useTrpcClient } from "@zentro/api/react";
import { Skeleton } from "@zentro/ui/shadcn/skeleton";
import { toastError } from "@zentro/ui/index";

import { statusLabels, statusOrder } from "~/src/features/tasks/lib/constants";
import { formatRelativeTime } from "~/src/features/tasks/lib/format";
import type {
  ActivityEvent,
  PrioritySummary,
  StatusSummary,
  TaskPriority,
} from "~/src/features/tasks/lib/types";

import { ActivityFeed } from "./activity-feed";
import { HomeHeader } from "./home-header";
import { PriorityBreakdown } from "./priority-breakdown";
import { TaskStats } from "./stats";
import { StatusOverview } from "./status-overview";
import { TaskListCard } from "./task-list-card";

type Props = {
  organizationName: string;
};

type Overview = Awaited<
  ReturnType<ReturnType<typeof useTrpcClient>["task"]["getOverview"]["query"]>
>;

const fieldActions: Record<string, string> = {
  name: "renamed",
  description: "edited the description of",
  status: "changed the status of",
  priority: "changed the priority of",
  assignedToMemberId: "changed the assignee of",
  assignee: "changed the assignee of",
  dueAt: "changed the due date of",
};

function toActivityEvents(events: Overview["activity"]): ActivityEvent[] {
  return events.map((event) => {
    let action = "updated";

    if (event.type === "task.created") action = "created";
    else if (event.type === "comment.created") action = "commented on";
    else if (event.type === "task.deleted") action = "deleted";
    else if (event.field) action = fieldActions[event.field] ?? "updated";

    return {
      id: event.id,
      actor: event.actor ?? "Someone",
      action,
      target: `${event.taskKey} ${event.taskName}`,
      time: formatRelativeTime(event.createdAt),
    };
  });
}

const priorities: TaskPriority[] = ["high", "medium", "low"];

export const HomeDashboard: FC<Props> = ({ organizationName }) => {
  const [overview, setOverview] = useState<Overview | null>(null);
  const trpc = useTrpcClient();

  useEffect(() => {
    let isMounted = true;

    trpc.task.getOverview
      .query()
      .then((data) => {
        if (isMounted) setOverview(data);
      })
      .catch(() => toastError("Error", "Could not load the task overview"));

    return () => {
      isMounted = false;
    };
  }, [trpc]);

  const statuses: StatusSummary[] = statusOrder.map((status) => ({
    id: status,
    label: statusLabels[status],
    count: overview?.byStatus.find((row) => row.status === status)?.count ?? 0,
  }));
  const priorityRows: PrioritySummary[] = priorities.map((priority) => ({
    id: priority,
    label: priority[0]!.toUpperCase() + priority.slice(1),
    count:
      overview?.byPriority.find((row) => row.priority === priority)?.count ?? 0,
  }));

  return (
    <section className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8 xl:px-10">
      <HomeHeader organizationName={organizationName} />

      {!overview ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-48 rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          <TaskStats counts={overview.counts} />

          <div className="grid gap-4 xl:grid-cols-2">
            <StatusOverview statuses={statuses} />
            <ActivityFeed events={toActivityEvents(overview.activity)} />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <PriorityBreakdown priorities={priorityRows} />
            <TaskListCard
              title="Assigned to you"
              description="Open tasks assigned to you, soonest due first."
              tasks={overview.assignedToMe}
              emptyMessage="No open tasks are assigned to you."
              detail="due"
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <TaskListCard
              title={`Overdue (${overview.counts.overdue})`}
              description="Open tasks that are past their due date."
              tasks={overview.overdue}
              emptyMessage="Nothing is overdue."
              detail="due"
            />
            <TaskListCard
              title="Recently updated"
              description="The latest changes across your tasks."
              tasks={overview.recentlyUpdated}
              emptyMessage="No tasks yet."
              detail="updated"
            />
          </div>
        </>
      )}
    </section>
  );
};
