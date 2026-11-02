import type { ReactNode } from "react";

import { AuthorizationBoundary } from "~/src/components/workspace/authorization/authorization-boundary";
import { getModuleAccess, requireModule } from "~/src/lib/dashboard-context";

export default async function HrLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  await requireModule("hr");

  const allowed = await getModuleAccess("hr.view");

  return (
    <AuthorizationBoundary isAllowed={allowed} permission="hr.view">
      {children}
    </AuthorizationBoundary>
  );
}
