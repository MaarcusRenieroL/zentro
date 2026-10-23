import type { ReactNode } from "react";

import { AuthorizationBoundary } from "~/src/components/workspace/authorization/authorization-boundary";
import { getModuleAccess, requireModule } from "~/src/lib/dashboard-context";

export default async function MailLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  await requireModule("mail");

  const allowed = await getModuleAccess("mail.view");

  return (
    <AuthorizationBoundary isAllowed={allowed} permission="mail.view">
      {children}
    </AuthorizationBoundary>
  );
}
