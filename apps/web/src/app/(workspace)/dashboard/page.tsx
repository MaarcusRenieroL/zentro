import { JSX } from "react";

import { TodayView } from "~/src/features/today/today-view";
import { getDashboardContext } from "~/src/lib/dashboard-context";
import { getDashboardData } from "~/src/lib/dashboard-data";
import { getTodayData } from "~/src/lib/today-data";

export default async function TodayPage(): Promise<JSX.Element> {
  const { organization, session, enabledModules, snapshot } =
    await getDashboardContext();
  const modules = new Set(enabledModules);
  const [today, dashboard] = await Promise.all([
    getTodayData({
      organizationId: organization.id,
      userId: session.user.id,
      enabledModules: modules,
      snapshot,
    }),
    getDashboardData({
      organizationId: organization.id,
      userId: session.user.id,
      enabledModules: modules,
      snapshot,
    }),
  ]);

  return (
    <TodayView
      firstName={session.user.name.split(" ")[0] ?? session.user.name}
      data={today}
      recentWork={dashboard.recentWork}
      links={dashboard.links}
    />
  );
}
