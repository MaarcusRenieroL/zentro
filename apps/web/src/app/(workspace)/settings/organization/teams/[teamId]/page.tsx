import { JSX } from "react";

import { AuthorizationBoundary } from "~/src/components/workspace/authorization/authorization-boundary";
import { TeamDetail } from "~/src/components/workspace/settings/team-detail";
import { getAuthorizedDashboardContext } from "~/src/lib/dashboard-context";

export default async function TeamPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}): Promise<JSX.Element> {
  const { teamId } = await params;
  const { authorization } = await getAuthorizedDashboardContext("teams.view");

  return (
    <AuthorizationBoundary
      isAllowed={authorization.isAllowed}
      permission={authorization.permission}
    >
      <TeamDetail teamId={teamId} />
    </AuthorizationBoundary>
  );
}
