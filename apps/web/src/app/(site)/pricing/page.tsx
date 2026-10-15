import type { Metadata } from "next";
import { JSX } from "react";

import { SitePage } from "~/src/components/site/site-page";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Plans for Zentro. Placeholder pricing until plans are published.",
};

export default function Page(): JSX.Element {
  return <SitePage page="pricing" />;
}
