import type { Metadata } from "next";
import { JSX } from "react";

import { SitePage } from "~/src/components/site/site-page";

export const metadata: Metadata = {
  title: "Roadmap",
  description: "The modules we are building next. No dates are set yet.",
};

export default function Page(): JSX.Element {
  return <SitePage page="roadmap" />;
}
