import type { Metadata } from "next";
import { JSX } from "react";

import { SitePage } from "~/src/components/site/site-page";

export const metadata: Metadata = {
  title: "Modules",
  description:
    "Eighteen modules, one workspace. See which are live and which are coming.",
};

export default function Page(): JSX.Element {
  return <SitePage page="modules" />;
}
