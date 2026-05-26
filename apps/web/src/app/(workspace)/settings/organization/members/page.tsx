import { auth } from "@zentro/auth";
import { headers } from "next/headers";
import { JSX } from "react";

import { MembersSection } from "~/src/components/workspace/settings/members-section";
import { getDashboardContext } from "~/src/lib/dashboard-context";

export default async function MembersSettingsPage(): Promise<JSX.Element> {
  const { session, organization, permissions } = await getDashboardContext();

  const membersList = await auth.api.listMembers({
    headers: await headers(),
    query: {
      organizationId: organization.id,
    },
  });

  return (
    <MembersSection
      members={membersList.members}
      userId={session!.user.id}
      orgId={organization.id}
      permissions={permissions}
    />
  );
}
