import { JSX } from "react";

import { AuthorizationBoundary } from "~/src/components/workspace/authorization/authorization-boundary";
import { AuditLog } from "~/src/components/workspace/activity/audit-log";
import { getAuthorizedDashboardContext } from "~/src/lib/dashboard-context";

export default async function AuditLogSettingsPage(): Promise<JSX.Element> {
  const { authorization } =
    await getAuthorizedDashboardContext("audit_logs.view");

  return (
    <AuthorizationBoundary
      isAllowed={authorization.isAllowed}
      permission={authorization.permission}
    >
      <AuditLog />
    </AuthorizationBoundary>
  );
}
