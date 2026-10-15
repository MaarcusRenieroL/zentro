import { headers } from "next/headers";
import { JSX } from "react";

import { auth } from "@zentro/auth";
import { db } from "@zentro/db";
import { and, count, eq, isNull } from "@zentro/db/drizzle";
import { docs, projects, tasks } from "@zentro/db/schema";

import { AuthorizationBoundary } from "~/src/components/workspace/authorization/authorization-boundary";
import { DangerZoneSection } from "~/src/components/workspace/settings/danger-zone-section";
import { getAuthorizedDashboardContext } from "~/src/lib/dashboard-context";

export const metadata = { title: "Delete or transfer" };

export default async function DangerSettingsPage(): Promise<JSX.Element> {
  const { authorization, roles, organization, session } =
    await getAuthorizedDashboardContext("org.delete");
  const listMembers = await auth.api.listMembers({
    headers: await headers(),
    query: {
      organizationId: organization.id,
    },
  });
  const [[projectRow], [taskRow], [docRow]] = authorization.isAllowed
    ? await Promise.all([
        db
          .select({ value: count() })
          .from(projects)
          .where(eq(projects.organizationId, organization.id)),
        db
          .select({ value: count() })
          .from(tasks)
          .where(
            and(
              eq(tasks.organizationId, organization.id),
              isNull(tasks.deletedAt),
            ),
          ),
        db
          .select({ value: count() })
          .from(docs)
          .where(
            and(
              eq(docs.organizationId, organization.id),
              isNull(docs.deletedAt),
            ),
          ),
      ])
    : [[{ value: 0 }], [{ value: 0 }], [{ value: 0 }]];

  return (
    <AuthorizationBoundary
      isAllowed={authorization.isAllowed}
      permission={authorization.permission}
    >
      <DangerZoneSection
        organizationRole={roles.organization}
        totalMembers={listMembers.total}
        organization={{ id: organization.id, name: organization.name }}
        admins={listMembers.members
          .filter(
            (member) =>
              member.role === "admin" && member.userId !== session.user.id,
          )
          .map((member) => ({ id: member.id, name: member.user.name }))}
        counts={{
          projects: projectRow?.value ?? 0,
          tasks: taskRow?.value ?? 0,
          docs: docRow?.value ?? 0,
        }}
      />
    </AuthorizationBoundary>
  );
}
