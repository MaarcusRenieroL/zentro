import type { Metadata } from "next";
import { Suspense } from "react";

import { CatchUpView } from "~/src/components/chat/chat-lists";

export const metadata: Metadata = { title: "Catch up" };

export default function Page() {
  return (
    <Suspense>
      <CatchUpView />
    </Suspense>
  );
}
