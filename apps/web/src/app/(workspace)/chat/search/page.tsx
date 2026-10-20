import type { Metadata } from "next";
import { Suspense } from "react";

import { SearchView } from "~/src/components/chat/search-view";

export const metadata: Metadata = { title: "Search messages" };

export default function SearchPage() {
  return (
    <Suspense>
      <SearchView />
    </Suspense>
  );
}
