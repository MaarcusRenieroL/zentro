import { FC } from "react";
import type { DashboardData } from "~/src/lib/dashboard-data";

import { QuickActions } from "./quick-actions";
import { PinnedSection } from "./pinned-section";
import { TasksSection } from "./tasks-section";
import { RecentActivitySection } from "./recent-activity-section";

type Props = {
  data: DashboardData;
};

export const OverviewSection: FC<Props> = ({ data }) => {
  return (
    <div className="grid w-full gap-4 lg:grid-cols-5">
      <div className="flex min-w-0 flex-col gap-4 lg:col-span-3">
        {data.modules.tasks ? (
          <TasksSection tasks={data.tasks} tasksHref={data.links.tasks ?? ""} />
        ) : null}
        <RecentActivitySection items={data.recentActivity} />
      </div>
      <div className="flex min-w-0 flex-col gap-4 lg:col-span-2">
        <QuickActions links={data.links} />
        <PinnedSection items={data.recentWork} />
      </div>
    </div>
  );
};
