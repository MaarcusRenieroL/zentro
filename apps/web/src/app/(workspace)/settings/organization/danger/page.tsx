import { auth } from "@zentro/auth";
import { headers } from "next/headers";
import { JSX } from "react";
import { AuthorizationBoundary } from "~/src/components/workspace/authorization/authorization-boundary";

import { DangerZoneSection } from "~/src/components/workspace/settings/danger-zone-section";
import { getAuthorizedDashboardContext } from "~/src/lib/dashboard-context";

export default async function DangerSettingsPage(): Promise<JSX.Element> {
  const { authorization, roles, organization } =
    await getAuthorizedDashboardContext("org.delete");
  const listMembers = await auth.api.listMembers({
    headers: await headers(),
    query: {
      organizationId: organization.id,
    },
  });

  return (
    <AuthorizationBoundary isAllowed={authorization.isAllowed}>
      <DangerZoneSection
        organizationRole={roles.organization}
        totalMembers={listMembers.total}
        organization={organization}
      />
    </AuthorizationBoundary>
  );
}
