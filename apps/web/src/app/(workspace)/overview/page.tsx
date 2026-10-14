import { JSX } from "react";

import { UnauthorizedEmptyState } from "~/src/components/workspace/authorization/authorization-boundary";
import { OverviewBento } from "~/src/components/workspace/overview/overview-bento";
import { getDashboardContext } from "~/src/lib/dashboard-context";
import { getDashboardData } from "~/src/lib/dashboard-data";
import { getTodayData } from "~/src/lib/today-data";

export const metadata = { title: "Overview" };

export default async function OverviewPage(): Promise<JSX.Element> {
  const { organization, session, enabledModules, snapshot } =
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
  const input = {
    organizationId: organization.id,
    userId: session.user.id,
    enabledModules: modules,
    snapshot,
  };
  const [data, today] = await Promise.all([
    getDashboardData(input),
    getTodayData(input),
  ]);

  return (
    <OverviewBento orgName={organization.name} data={data} week={today.week} />
  );
}
