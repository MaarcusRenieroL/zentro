import type { ReactNode } from "react";

import { AuthorizationBoundary } from "~/src/components/workspace/authorization/authorization-boundary";
import { getModuleAccess, requireModule } from "~/src/lib/dashboard-context";

export default async function TicketsLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  await requireModule("tickets");

  const allowed = await getModuleAccess("tickets.view");

  return (
    <AuthorizationBoundary isAllowed={allowed} permission="tickets.view">
      {children}
    </AuthorizationBoundary>
  );
}
