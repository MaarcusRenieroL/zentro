import { auth } from "@zentro/auth";
import { headers } from "next/headers";
import { JSX } from "react";

import { db } from "@zentro/db";
import { eq, max } from "@zentro/db/drizzle";
import { members, sessions, teamMembers, teams } from "@zentro/db/schema";

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

  // Team names and the last time each person had a session open.
  const [teamRows, activeRows] = authorization.isAllowed
    ? await Promise.all([
        db
          .select({ userId: members.userId, team: teams.name })
          .from(teamMembers)
          .innerJoin(members, eq(members.id, teamMembers.memberId))
          .innerJoin(teams, eq(teams.id, teamMembers.teamId))
          .where(eq(teamMembers.organizationId, organization.id)),
        db
          .select({ userId: sessions.userId, at: max(sessions.updatedAt) })
          .from(sessions)
          .groupBy(sessions.userId),
      ])
    : [[], []];
  const extras: Record<string, { teams: string[]; lastActive: string | null }> =
    {};

  for (const member of membersList.members) {
    extras[member.userId] = { teams: [], lastActive: null };
  }

  for (const row of teamRows) extras[row.userId]?.teams.push(row.team);
  for (const row of activeRows) {
    const entry = extras[row.userId];

    if (entry && row.at) entry.lastActive = row.at.toISOString();
  }

  return (
    <AuthorizationBoundary
      isAllowed={authorization.isAllowed}
      permission={authorization.permission}
    >
      <MembersSection
        members={membersList.members}
        userId={session!.user.id}
        permissions={permissions}
        extras={extras}
      />
    </AuthorizationBoundary>
  );
}
