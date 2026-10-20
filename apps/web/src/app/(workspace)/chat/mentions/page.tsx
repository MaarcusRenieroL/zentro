import type { Metadata } from "next";
import { Suspense } from "react";

import { MentionsView } from "~/src/components/chat/mentions-view";

export const metadata: Metadata = { title: "Mentions" };

export default function MentionsPage() {
  return (
    <Suspense>
      <MentionsView />
    </Suspense>
  );
}
