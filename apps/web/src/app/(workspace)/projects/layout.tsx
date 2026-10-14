import { ReactNode, Suspense } from "react";

import { AuthorizationBoundary } from "~/src/components/workspace/authorization/authorization-boundary";
import { ModuleSectionNav } from "~/src/components/shell/module-section-nav";
import {
  getDashboardContext,
  getModuleAccess,
  requireModule,
} from "~/src/lib/dashboard-context";
import { buildShell } from "~/src/lib/shell-data";

export default async function ProjectsLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  await requireModule("projects");

  // A role on a single project or team is enough to open the module; the
  // pages then show only what the user can see.
  const allowed = await getModuleAccess("projects.view");
  const { enabledModules, reachable } = await getDashboardContext();
  const items =
    buildShell(enabledModules, reachable).moduleNav["projects"] ?? [];

  return (
    <AuthorizationBoundary isAllowed={allowed}>
      <Suspense fallback={null}>
        <ModuleSectionNav items={items} label="Projects" />
      </Suspense>
      {children}
    </AuthorizationBoundary>
  );
}
