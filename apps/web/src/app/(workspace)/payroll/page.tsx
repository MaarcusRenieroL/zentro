import type { Metadata } from "next";

import { PayrollHome } from "~/src/components/payroll/payroll-home";
import { getModuleAccess } from "~/src/lib/dashboard-context";

export const metadata: Metadata = { title: "Payroll" };

export default async function PayrollPage() {
  return (
    <PayrollHome
      canViewAll={await getModuleAccess("payroll.view")}
      canViewOwn={await getModuleAccess("payroll.payslips.view")}
    />
  );
}
