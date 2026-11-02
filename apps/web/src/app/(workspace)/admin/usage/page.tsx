import type { Metadata } from "next";

import { AdminUsage } from "~/src/components/admin/admin-console";

export const metadata: Metadata = { title: "Usage" };

export default function AdminUsagePage() {
  return <AdminUsage />;
}
