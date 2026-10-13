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
    <div className="grid w-full gap-5 lg:grid-cols-2 xl:grid-cols-7">
      <div className="flex min-w-0 flex-col gap-5 xl:col-span-2">
        <QuickActions links={data.links} />
        <PinnedSection items={data.recentWork} />
      </div>
      {data.modules.tasks ? (
        <>
          <div className="min-w-0 lg:col-span-2 xl:col-span-3">
            <RecentActivitySection items={data.recentActivity} />
          </div>
          <div className="flex min-w-0 flex-col gap-5 xl:col-span-2">
            <TasksSection
              tasks={data.tasks}
              tasksHref={data.links.tasks ?? ""}
            />
          </div>
        </>
      ) : null}
    </div>
  );
};
