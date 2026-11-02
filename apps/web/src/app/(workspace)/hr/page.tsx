import type { Metadata } from "next";

import { HrDirectory } from "~/src/components/hr/hr-directory";

export const metadata: Metadata = { title: "People" };

export default function HrPage() {
  return <HrDirectory />;
}
