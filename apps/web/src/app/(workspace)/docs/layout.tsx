import { ReactNode, Suspense } from "react";

import { AuthorizationBoundary } from "~/src/components/workspace/authorization/authorization-boundary";
import {
  ModuleNavProvider,
  ModuleSectionNav,
} from "~/src/components/shell/module-section-nav";
import {
  getDashboardContext,
  getModuleAccess,
  requireModule,
} from "~/src/lib/dashboard-context";
import { buildShell } from "~/src/lib/shell-data";

export default async function DocsLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  await requireModule("docs");

  // A role on a single project or team is enough to open the module; the
  // pages then show only what the user can see.
  const allowed = await getModuleAccess("docs.view");
  const { enabledModules, reachable } = await getDashboardContext();
  const items = buildShell(enabledModules, reachable).moduleNav["docs"] ?? [];

  return (
    <AuthorizationBoundary isAllowed={allowed} permission="docs.view">
      <ModuleNavProvider items={items} label="Docs">
        <Suspense fallback={null}>
          <ModuleSectionNav />
        </Suspense>
        {children}
      </ModuleNavProvider>
    </AuthorizationBoundary>
  );
}
