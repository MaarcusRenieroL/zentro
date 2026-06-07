import { JSX } from "react";

import { TeamsSection } from "~/src/components/workspace/settings/teams-section";
import { getDashboardContext } from "~/src/lib/dashboard-context";

export default async function TeamsSettingsPage(): Promise<JSX.Element> {
  const { permissions } = await getDashboardContext();

  return <TeamsSection permissions={permissions} />;
}
