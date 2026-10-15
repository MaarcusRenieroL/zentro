import type { Metadata } from "next";

import { InboxView } from "~/src/components/notifications/inbox-view";

export const metadata: Metadata = { title: "Notifications" };

export default function InboxPage() {
  return <InboxView />;
}
