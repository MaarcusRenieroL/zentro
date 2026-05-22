import { auth } from "@zentro/auth";
import { headers } from "next/headers";
import { JSX } from "react";

import { DangerZoneSection } from "~/src/components/workspace/settings/danger-zone-section";
import { getDashboardContext } from "~/src/lib/dashboard-context";

export default async function DangerSettingsPage(): Promise<JSX.Element> {
  const { roles, organization } = await getDashboardContext();
  const listMembers = await auth.api.listMembers({
    headers: await headers(),
    query: {
      organizationId: organization.id,
    },
  });

  return (
    <DangerZoneSection
      organizationRole={roles.organization}
      totalMembers={listMembers.total}
      organization={organization}
    />
  );
}
