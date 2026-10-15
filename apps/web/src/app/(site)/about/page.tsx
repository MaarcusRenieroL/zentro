import type { Metadata } from "next";
import { JSX } from "react";

import { SitePage } from "~/src/components/site/site-page";

export const metadata: Metadata = {
  title: "About and contact",
  description: "About Zentro, and how to reach us.",
};

export default function Page(): JSX.Element {
  return <SitePage page="about" />;
}
