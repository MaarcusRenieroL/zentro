import type { ReactNode } from "react";

import { AuthorizationBoundary } from "~/src/components/workspace/authorization/authorization-boundary";
import { getModuleAccess, requireModule } from "~/src/lib/dashboard-context";

export default async function CalendarLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  await requireModule("calendar");

  const allowed = await getModuleAccess("calendar.view");

  return (
    <AuthorizationBoundary isAllowed={allowed} permission="calendar.view">
      {children}
    </AuthorizationBoundary>
  );
}
