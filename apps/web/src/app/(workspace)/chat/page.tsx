import type { Metadata } from "next";

import { ComingSoon } from "~/src/components/system/coming-soon";
import { getDashboardContext } from "~/src/lib/dashboard-context";

export const metadata: Metadata = { title: "Chat" };

export default async function ChatPage() {
  const { session } = await getDashboardContext();

  return <ComingSoon kind="chat" email={session.user.email} />;
}
