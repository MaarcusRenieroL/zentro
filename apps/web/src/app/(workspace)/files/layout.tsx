import type { ReactNode } from "react";

import { AuthorizationBoundary } from "~/src/components/workspace/authorization/authorization-boundary";
import { getModuleAccess, requireModule } from "~/src/lib/dashboard-context";

export default async function FilesLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  await requireModule("files");

  const allowed = await getModuleAccess("files.view");

  return (
    <AuthorizationBoundary isAllowed={allowed} permission="files.view">
      {children}
    </AuthorizationBoundary>
  );
}
