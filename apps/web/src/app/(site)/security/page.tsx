import type { Metadata } from "next";
import { JSX } from "react";

import { SitePage } from "~/src/components/site/site-page";

export const metadata: Metadata = {
  title: "Security",
  description:
    "How roles, project access and the audit log work together in Zentro.",
};

export default function Page(): JSX.Element {
  return <SitePage page="security" />;
}
