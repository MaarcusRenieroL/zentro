import { FC } from "react";
import { ActivityFeed } from "./activity-feed";
import {
  prioritySummary,
  recentActivity,
  statusSummary,
  workTypeSummary,
} from "~/src/features/tasks/lib/data";
import { HomeHeader } from "./home-header";
import { PriorityBreakdown } from "./priority-breakdown";
import { TaskStats } from "./stats";
import { StatusOverview } from "./status-overview";
import { WorkTypes } from "./work-types";

type Props = {
  organizationName: string;
};

export const HomeDashboard: FC<Props> = ({ organizationName }) => {
  return (
    <section className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8 xl:px-10">
      <HomeHeader organizationName={organizationName} />

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
};
