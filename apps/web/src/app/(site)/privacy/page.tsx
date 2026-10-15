import type { Metadata } from "next";
import { JSX } from "react";

import { SitePage } from "~/src/components/site/site-page";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How Zentro handles your data.",
};

export default function Page(): JSX.Element {
  return <SitePage page="legal" doc="privacy" />;
}
