import { JSX } from "react";
import { AuthorizationBoundary } from "~/src/components/workspace/authorization/authorization-boundary";

import { GeneralSection } from "~/src/components/workspace/settings/general-section";
import { getAuthorizedDashboardContext } from "~/src/lib/dashboard-context";

export default async function GeneralSettingsPage(): Promise<JSX.Element> {
  const { authorization, organization } = await getAuthorizedDashboardContext({
    organization: ["update"],
  });

  return (
    <AuthorizationBoundary isAllowed={authorization.isAllowed}>
      <GeneralSection
        organization={{
          name: organization.name,
          slug: organization.slug,
          id: organization.id,
        }}
      />
    </AuthorizationBoundary>
  );
}
