import { JSX } from "react";

import { UnauthorizedEmptyState } from "~/src/components/workspace/authorization/authorization-boundary";
import { OverviewBoard } from "~/src/components/workspace/overview/overview-board";
import { AdminFrame } from "~/src/components/workspace/settings/frames";
import { getDashboardContext } from "~/src/lib/dashboard-context";
import { getDashboardData } from "~/src/lib/dashboard-data";
import { getOverviewData } from "~/src/lib/overview-data";

export const metadata = { title: "Overview" };

export default async function OverviewPage(): Promise<JSX.Element> {
  const { organization, session, enabledModules, snapshot, can } =
    await getDashboardContext();

  if (snapshot.baseRole !== "owner" && snapshot.baseRole !== "admin") {
    return (
      <UnauthorizedEmptyState
        title="Overview is for owners and admins"
        description="Your own work is on Today."
      />
    );
  }

  const modules = new Set(enabledModules);
  const [data, overview] = await Promise.all([
    getDashboardData({
      organizationId: organization.id,
      userId: session.user.id,
      enabledModules: modules,
      snapshot,
    }),
    getOverviewData({
      organizationId: organization.id,
      enabledModules: modules,
    }),
  ]);

  return (
    <AdminFrame>
      <OverviewBoard
        data={overview}
        activity={data.recentActivity}
        canSeeAudit={can("audit_logs.view")}
      />
    </AdminFrame>
  );
}
