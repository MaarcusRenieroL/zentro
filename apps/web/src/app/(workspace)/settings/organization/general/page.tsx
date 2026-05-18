import { JSX } from "react";

import { GeneralSection } from "~/src/components/workspace/settings/general-section";
import { getDashboardContext } from "~/src/lib/dashboard-context";

export default async function GeneralSettingsPage(): Promise<JSX.Element> {
  const { organization } = await getDashboardContext();

  return (
    <GeneralSection
      organization={{
        name: organization.name,
        slug: organization.slug,
        id: organization.id,
      }}
    />
  );
}
