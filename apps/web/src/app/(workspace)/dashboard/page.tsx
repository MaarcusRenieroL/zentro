import { JSX } from "react";

import { ActivitySection } from "~/src/components/workspace/dashboard/activity-section";
import { OverviewSection } from "~/src/components/workspace/dashboard/overview-section";
import { getDashboardData } from "~/src/lib/dashboard-data";
import { getDashboardContext } from "~/src/lib/dashboard-context";

export default async function DashboardPage(): Promise<JSX.Element> {
  const { organization, session, enabledModules, snapshot } =
    await getDashboardContext();
  const dashboardData = await getDashboardData({
    organizationId: organization.id,
    userId: session.user.id,
    enabledModules: new Set(enabledModules),
    snapshot,
  });

  return (
    <section className="flex w-full flex-col gap-6">
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
