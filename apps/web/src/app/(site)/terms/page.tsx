import type { Metadata } from "next";
import { JSX } from "react";

import { SitePage } from "~/src/components/site/site-page";

export const metadata: Metadata = {
  title: "Terms of service",
  description: "The terms for using Zentro.",
};

export default function Page(): JSX.Element {
  return <SitePage page="legal" doc="terms" />;
}
