import type { ReactNode } from "react";

import { AuthorizationBoundary } from "~/src/components/workspace/authorization/authorization-boundary";
import { getModuleAccess, requireModule } from "~/src/lib/dashboard-context";

export default async function WhiteboardsLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  await requireModule("whiteboards");

  const allowed = await getModuleAccess("whiteboards.view");

  return (
    <AuthorizationBoundary isAllowed={allowed} permission="whiteboards.view">
      {children}
    </AuthorizationBoundary>
  );
}
