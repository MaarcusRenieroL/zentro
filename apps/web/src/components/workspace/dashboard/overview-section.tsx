import { FC } from "react";
import { QuickActions } from "./quick-actions";
import { PinnedSection } from "./pinned-section";
import { TasksSection } from "./tasks-section";
import { RecentActivitySection } from "./recent-activity-section";
import { CalendarSection } from "./calendar-section";

export const OverviewSection: FC = () => {
  return (
    <div className="grid w-full gap-5 lg:grid-cols-2 xl:grid-cols-7">
      <div className="flex min-w-0 flex-col gap-5 xl:col-span-2">
        <QuickActions />
        <PinnedSection />
      </div>
      <div className="min-w-0 lg:col-span-2 xl:col-span-3">
        <RecentActivitySection />
      </div>
      <div className="flex min-w-0 flex-col gap-5 xl:col-span-2">
        <CalendarSection />
        <TasksSection />
      </div>
    </div>
  );
};
