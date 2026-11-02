import type { ReactNode } from "react";

import { AuthorizationBoundary } from "~/src/components/workspace/authorization/authorization-boundary";
import { getModuleAccess, requireModule } from "~/src/lib/dashboard-context";

export default async function AdminLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  await requireModule("admin");

  const allowed = await getModuleAccess("admin.view");

  return (
    <AuthorizationBoundary isAllowed={allowed} permission="admin.view">
      {children}
    </AuthorizationBoundary>
  );
}
