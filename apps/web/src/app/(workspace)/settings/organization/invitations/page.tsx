import { JSX } from "react";

import { db } from "@zentro/db";
import { desc, eq } from "@zentro/db/drizzle";
import { invitations, users } from "@zentro/db/schema";

import { InvitationsSection } from "~/src/components/workspace/settings/invitations-section";
import { getAuthorizedDashboardContext } from "~/src/lib/dashboard-context";
import { AuthorizationBoundary } from "~/src/components/workspace/authorization/authorization-boundary";

export default async function InvitationsSettingsPage(): Promise<JSX.Element> {
  const { authorization, organization } =
    await getAuthorizedDashboardContext("invitations.view");

  // Every invite this organization sent, newest first, with who sent it.
  const rows = authorization.isAllowed
    ? await db
        .select({
          id: invitations.id,
          email: invitations.email,
          role: invitations.role,
          status: invitations.status,
          expiresAt: invitations.expiresAt,
          createdAt: invitations.createdAt,
          inviterName: users.name,
        })
        .from(invitations)
        .leftJoin(users, eq(users.id, invitations.inviterId))
        .where(eq(invitations.organizationId, organization.id))
        .orderBy(desc(invitations.createdAt))
    : [];

  return (
    <AuthorizationBoundary
      isAllowed={authorization.isAllowed}
      permission={authorization.permission}
    >
      <InvitationsSection
        organizationName={organization.name}
        invitations={rows.map((row) => ({
          ...row,
          expiresAt: row.expiresAt?.toISOString() ?? null,
          createdAt: row.createdAt.toISOString(),
        }))}
      />
    </AuthorizationBoundary>
  );
}
