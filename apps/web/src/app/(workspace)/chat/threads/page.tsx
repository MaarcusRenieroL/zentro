import type { Metadata } from "next";
import { Suspense } from "react";

import { ThreadsView } from "~/src/components/chat/chat-lists";

export const metadata: Metadata = { title: "Threads" };

export default function Page() {
  return (
    <Suspense>
      <ThreadsView />
    </Suspense>
  );
}
