import { JSX, ReactNode } from "react";

import { SettingsShell } from "~/src/components/workspace/settings/settings-shell";
import { getDashboardContext } from "~/src/lib/dashboard-context";

export default async function SettingsLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>): Promise<JSX.Element> {
  const { organization } = await getDashboardContext();

  return (
    <SettingsShell
      organization={{
        name: organization.name,
        slug: organization.slug,
        logo: organization.logo,
      }}
    >
      {children}
    </SettingsShell>
  );
}
