import type { Metadata } from "next";

import { ComingSoon } from "~/src/components/system/coming-soon";
import { getDashboardContext } from "~/src/lib/dashboard-context";

export const metadata: Metadata = { title: "Files" };

export default async function FilesPage() {
  const { session } = await getDashboardContext();

  return <ComingSoon kind="files" email={session.user.email} />;
}
