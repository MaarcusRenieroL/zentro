import { JSX } from "react";

import { SecuritySection } from "~/src/components/workspace/settings/account-sections";

export const metadata = { title: "Security" };

export default async function SecuritySectionPage(): Promise<JSX.Element> {
  return <SecuritySection />;
}
