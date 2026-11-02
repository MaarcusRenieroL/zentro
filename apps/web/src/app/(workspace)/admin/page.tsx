import type { Metadata } from "next";

import { AdminOverview } from "~/src/components/admin/admin-console";

export const metadata: Metadata = { title: "Administration" };

export default function AdminOverviewPage() {
  return <AdminOverview />;
}
