import type { Metadata } from "next";
import { JSX } from "react";

import { SitePage } from "~/src/components/site/site-page";

export const metadata: Metadata = {
  title: "Cookie policy",
  description: "How Zentro uses cookies.",
};

export default function Page(): JSX.Element {
  return <SitePage page="legal" doc="cookies" />;
}
