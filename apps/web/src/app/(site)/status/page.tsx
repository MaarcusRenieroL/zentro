import type { Metadata } from "next";
import { JSX } from "react";

import { SitePage } from "~/src/components/site/site-page";

export const metadata: Metadata = {
  title: "Status",
  description: "Current status of Zentro services.",
};

export default function Page(): JSX.Element {
  return <SitePage page="status" />;
}
