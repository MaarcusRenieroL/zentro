import { JSX } from "react";
import { AuthorizationBoundary } from "~/src/components/workspace/authorization/authorization-boundary";
import { AutomationsManager } from "~/src/features/automations/components/automations-manager";
import { getAuthorizedDashboardContext } from "~/src/lib/dashboard-context";

export default async function AutomationsSettingsPage(): Promise<JSX.Element> {
  const { authorization } = await getAuthorizedDashboardContext("tasks.view");

  return (
    <AuthorizationBoundary
      isAllowed={authorization.isAllowed}
      permission={authorization.permission}
    >
      <AutomationsManager />
    </AuthorizationBoundary>
  );
}
