import { JSX } from "react";
import { headers } from "next/headers";
import { auth } from "@zentro/auth";

import { InvitationsSection } from "~/src/components/workspace/settings/invitations-section";
import { getDashboardContext } from "~/src/lib/dashboard-context";

export default async function InvitationsSettingsPage(): Promise<JSX.Element> {
  const { organization } = await getDashboardContext();

  const invitations = await auth.api.listInvitations({
    headers: await headers(),
    query: {
      organizationId: organization.id,
    },
  });

  return (
    <InvitationsSection
      organizationId={organization.id}
      invitations={invitations}
    />
  );
}
