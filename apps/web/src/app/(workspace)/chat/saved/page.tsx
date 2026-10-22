import type { Metadata } from "next";
import { Suspense } from "react";

import { SavedView } from "~/src/components/chat/chat-lists";

export const metadata: Metadata = { title: "Saved" };

export default function Page() {
  return (
    <Suspense>
      <SavedView />
    </Suspense>
  );
}
