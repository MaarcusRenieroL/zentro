import { JSX } from "react";

import { ActivitySection } from "~/src/components/workspace/dashboard/activity-section";
import { OverviewSection } from "~/src/components/workspace/dashboard/overview-section";
import { getDashboardData } from "~/src/lib/dashboard-data";
import { getDashboardContext } from "~/src/lib/dashboard-context";

export default async function DashboardPage(): Promise<JSX.Element> {
  const { organization, session } = await getDashboardContext();
  const dashboardData = await getDashboardData({
    organizationId: organization.id,
    userId: session.user.id,
  });

  return (
    <section className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:gap-8 xl:px-10">
      <ActivitySection
        activityPills={dashboardData.activityPills}
        orgName={organization.name}
        name={session.user.name}
        workspaceStats={dashboardData.workspaceStats}
      />
      <OverviewSection data={dashboardData} />
    </section>
  );
}
