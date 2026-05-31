import { SlidersHorizontalIcon } from "lucide-react";

import { Button } from "@zentro/ui/shadcn/button";

import { getDashboardContext } from "~/src/lib/dashboard-context";
import { ActivityFeed } from "../components/home/activity-feed";
import {
  prioritySummary,
  recentActivity,
  statusSummary,
  workTypeSummary,
} from "../components/home/data";
import { TaskStats } from "../components/home/stats";
import {
  PriorityBreakdown,
  StatusOverview,
  WorkTypes,
} from "../components/home/summary-panels";

export default async function HomePage() {
  const { organization } = await getDashboardContext();

  return (
    <section className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8 xl:px-10">
      <div className="flex min-w-0 flex-col gap-4 border-b pb-5">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-muted-foreground">Summary</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {organization.name}
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            A quick snapshot of task progress, priorities, and recent changes.
          </p>
        </div>
      </div>

      <TaskStats />

      <div className="grid gap-4 xl:grid-cols-2">
        <StatusOverview statuses={statusSummary} />
        <ActivityFeed events={recentActivity} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <PriorityBreakdown priorities={prioritySummary} />
        <WorkTypes types={workTypeSummary} />
      </div>
    </section>
  );
}
