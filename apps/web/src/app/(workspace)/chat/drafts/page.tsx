import type { Metadata } from "next";
import { Suspense } from "react";

import { DraftsView } from "~/src/components/chat/chat-lists";

export const metadata: Metadata = { title: "Drafts & scheduled" };

export default function Page() {
  return (
    <Suspense>
      <DraftsView />
    </Suspense>
  );
}
