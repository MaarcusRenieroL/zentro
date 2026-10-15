import type { Metadata } from "next";
import { JSX } from "react";

import { SitePage } from "~/src/components/site/site-page";

export const metadata: Metadata = {
  title: "Changelog",
  description: "What shipped in Zentro, newest first.",
};

export default function Page(): JSX.Element {
  return <SitePage page="changelog" />;
}
