import { JSX } from "react";
import { headers } from "next/headers";
import { auth } from "@zentro/auth";

import { InvitationsSection } from "~/src/components/workspace/settings/invitations-section";
import { getAuthorizedDashboardContext } from "~/src/lib/dashboard-context";
import { AuthorizationBoundary } from "~/src/components/workspace/authorization/authorization-boundary";

export default async function InvitationsSettingsPage(): Promise<JSX.Element> {
  const { authorization, organization } =
    await getAuthorizedDashboardContext("invitations.view");

  const invitations = await auth.api.listInvitations({
    headers: await headers(),
    query: {
      organizationId: organization.id,
    },
  });

  return (
    <AuthorizationBoundary
      isAllowed={authorization.isAllowed}
      permission={authorization.permission}
    >
      <InvitationsSection invitations={invitations} />
    </AuthorizationBoundary>
  );
}
