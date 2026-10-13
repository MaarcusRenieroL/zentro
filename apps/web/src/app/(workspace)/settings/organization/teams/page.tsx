import { JSX } from "react";

import { AuthorizationBoundary } from "~/src/components/workspace/authorization/authorization-boundary";
import { TeamsSection } from "~/src/components/workspace/settings/teams-section";
import { getAuthorizedDashboardContext } from "~/src/lib/dashboard-context";

export default async function TeamsSettingsPage(): Promise<JSX.Element> {
  const { permissions, authorization } =
    await getAuthorizedDashboardContext("teams.view");

  return (
    <AuthorizationBoundary isAllowed={authorization.isAllowed}>
      <TeamsSection permissions={permissions} />
    </AuthorizationBoundary>
  );
}
