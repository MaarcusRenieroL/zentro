import { JSX } from "react";

import { AppearanceSection } from "~/src/components/workspace/settings/account-sections";

export const metadata = { title: "Appearance" };

export default async function AppearanceSectionPage(): Promise<JSX.Element> {
  return <AppearanceSection />;
}
