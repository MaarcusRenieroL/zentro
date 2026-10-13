import { JSX } from "react";
import { DashboardNavbar } from "~/src/components/layout/dashboard-navbar";

import { buildNavSections, filterNavSections } from "@zentro/modules";
import { effectivePermissions, getCatalogKeys } from "@zentro/permissions";

import { PermissionProvider } from "~/src/components/permissions/permission-provider";

import { paths } from "~/src/lib/paths";
import { getDashboardContext } from "~/src/lib/dashboard-context";
import {
  SidebarInset,
  SidebarProvider,
} from "@zentro/ui/components/shadcn/sidebar";
import { TooltipProvider } from "@zentro/ui/components/shadcn/tooltip";
import { WorkspaceSidebar } from "~/src/components/layout/workspace-sidebar";

export default async function DashboardLayout({
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
  // Navigation follows what the user can reach, so a role on a single project
  // still shows Projects, Tasks and Docs.
  const sections = filterNavSections(
    buildNavSections(new Set(enabledModules)),
    (key) => reachable[key] ?? false,
  );

  return (
    <PermissionProvider
      value={{
        baseRole: snapshot.baseRole,
        userId: snapshot.userId,
        permissions,
        reachable,
      }}
    >
      <TooltipProvider>
        <SidebarProvider defaultOpen>
          <WorkspaceSidebar sections={sections} />

          <SidebarInset>
            <div className="min-h-screen bg-background text-foreground">
              <DashboardNavbar
                orgSlug={organization.slug}
                organizations={organizations.map((org) => ({
                  id: org.id,
                  name: org.name,
                  slug: org.slug,
                }))}
                createOrganizationHref={paths.auth.createOrganization()}
                user={{
                  name: session.user.name,
                  email: session.user.email,
                }}
              />
              <main>{children}</main>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </PermissionProvider>
  );
}
