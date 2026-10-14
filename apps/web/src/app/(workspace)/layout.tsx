import { JSX } from "react";
import { cookies } from "next/headers";

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
  const { modules } = buildShell(enabledModules, reachable);
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
      >
        {children}
      </AppShell>
    </PermissionProvider>
  );
}
