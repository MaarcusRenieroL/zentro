import { JSX } from "react";
import { cookies } from "next/headers";

import { db } from "@zentro/db";
import { and, count, eq, isNull, ne } from "@zentro/db/drizzle";
import { members, tasks } from "@zentro/db/schema";

import { effectivePermissions, getCatalogKeys } from "@zentro/permissions";

import { PermissionProvider } from "~/src/components/permissions/permission-provider";
import { AppShell } from "~/src/components/shell/app-shell";
import { getDashboardContext } from "~/src/lib/dashboard-context";
import { paths } from "~/src/lib/paths";
import { buildShell } from "~/src/lib/shell-data";

export default async function WorkspaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): Promise<JSX.Element> {
  const {
    organization,
    organizations,
    session,
    enabledModules,
    snapshot,
    reachable,
  } = await getDashboardContext();
  const permissions = effectivePermissions(snapshot, getCatalogKeys());
  const { modules } = buildShell(enabledModules, reachable, {
    overview: snapshot.baseRole === "owner" || snapshot.baseRole === "admin",
  });
  // The role and headcount under the organization name, and the open tasks
  // that are the user's own.
  const [[peopleRow], [taskRow]] = await Promise.all([
    db
      .select({ value: count() })
      .from(members)
      .where(eq(members.organizationId, organization.id)),
    enabledModules.includes("tasks")
      ? db
          .select({ value: count() })
          .from(tasks)
          .innerJoin(members, eq(members.id, tasks.assignedToMemberId))
          .where(
            and(
              eq(tasks.organizationId, organization.id),
              eq(members.userId, session.user.id),
              ne(tasks.status, "done"),
              isNull(tasks.deletedAt),
            ),
          )
      : [{ value: 0 }],
  ]);
  const baseRole = snapshot.baseRole ?? "member";
  const roleLabel = baseRole.charAt(0).toUpperCase() + baseRole.slice(1);
  const people = peopleRow?.value ?? 0;
  const sidebarOpen = (await cookies()).get("sidebar_state")?.value !== "false";
  const settings = modules.find((item) => item.id === "settings");

  return (
    <PermissionProvider
      value={{
        baseRole: snapshot.baseRole,
        userId: snapshot.userId,
        permissions,
        reachable,
      }}
    >
      <AppShell
        modules={modules}
        enabledModules={enabledModules}
        organizations={organizations.map((org) => ({
          id: org.id,
          name: org.name,
          slug: org.slug,
        }))}
        activeOrgSlug={organization.slug}
        user={{ name: session.user.name, email: session.user.email }}
        links={{
          settingsHref: settings?.href ?? null,
          membersHref: reachable["members.view"]
            ? paths.membersSettings()
            : null,
        }}
        sidebarOpen={sidebarOpen}
        orgSubtitle={`${roleLabel} · ${people} ${people === 1 ? "person" : "people"}`}
        taskCount={taskRow?.value ?? 0}
      >
        {children}
      </AppShell>
    </PermissionProvider>
  );
}
