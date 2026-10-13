import { ReactNode } from "react";

import { AuthorizationBoundary } from "~/src/components/workspace/authorization/authorization-boundary";
import { getModuleAccess, requireModule } from "~/src/lib/dashboard-context";

export default async function TasksLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  await requireModule("tasks");

  // A role on a single project or team is enough to open the module; the
  // pages then show only what the user can see.
  return (
    <AuthorizationBoundary isAllowed={await getModuleAccess("tasks.view")}>
      {children}
    </AuthorizationBoundary>
  );
}
