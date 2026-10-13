import { auth } from "@zentro/auth";
import { headers } from "next/headers";
import { JSX } from "react";

import { AuthorizationBoundary } from "~/src/components/workspace/authorization/authorization-boundary";
import { MembersSection } from "~/src/components/workspace/settings/members-section";
import { getAuthorizedDashboardContext } from "~/src/lib/dashboard-context";

export default async function MembersSettingsPage(): Promise<JSX.Element> {
  const { session, organization, permissions, authorization } =
    await getAuthorizedDashboardContext("members.view");

  const membersList = authorization.isAllowed
    ? await auth.api.listMembers({
        headers: await headers(),
        query: {
          organizationId: organization.id,
        },
      })
    : { members: [] };

  return (
    <AuthorizationBoundary isAllowed={authorization.isAllowed}>
      <MembersSection
        members={membersList.members}
        userId={session!.user.id}
        permissions={permissions}
      />
    </AuthorizationBoundary>
  );
}
