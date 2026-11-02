import type { ReactNode } from "react";

import { AuthorizationBoundary } from "~/src/components/workspace/authorization/authorization-boundary";
import { getModuleAccess, requireModule } from "~/src/lib/dashboard-context";

export default async function PayrollLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  await requireModule("payroll");

  const allowed =
    (await getModuleAccess("payroll.payslips.view")) ||
    (await getModuleAccess("payroll.view"));

  return (
    <AuthorizationBoundary
      isAllowed={allowed}
      permission="payroll.payslips.view"
    >
      {children}
    </AuthorizationBoundary>
  );
}
