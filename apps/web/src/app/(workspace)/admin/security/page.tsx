import type { Metadata } from "next";

import { AdminSecurity } from "~/src/components/admin/admin-console";

export const metadata: Metadata = { title: "Security" };

export default function AdminSecurityPage() {
  return <AdminSecurity />;
}
