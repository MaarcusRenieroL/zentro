import { paths } from "~/src/lib/paths";
import { JSX } from "react";
import { db } from "@zentro/db";
import { and, eq } from "@zentro/db/drizzle";
import { projects, teams, users } from "@zentro/db/schema";
import { redirect } from "next/navigation";

import { GeneralSection } from "~/src/components/project-detail/settings/general-section";
import { AuthorizationBoundary } from "~/src/components/workspace/authorization/authorization-boundary";
import { getDashboardContext } from "~/src/lib/dashboard-context";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function GeneralSettingsPage({
  params,
}: Props): Promise<JSX.Element> {
  const { slug } = await params;
  const { organization, can } = await getDashboardContext();

  const [project] = await db
    .select({
      id: projects.id,
      visibility: projects.visibility,
      teamIdForAccess: projects.teamId,
      name: projects.name,
      description: projects.description,
      slug: projects.slug,
      teamId: projects.teamId,
      teamName: teams.name,
      teamColor: teams.color,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      status: projects.status,
      owner: users.name,
    })
    .from(projects)
    .leftJoin(users, eq(users.id, projects.createdById))
    .leftJoin(teams, eq(teams.id, projects.teamId))
    .where(
      and(
        eq(projects.slug, slug),
        eq(projects.organizationId, organization.id),
      ),
    )
    .limit(1);

  const scope = project
    ? {
        project: {
          id: project.id,
          teamId: project.teamIdForAccess,
          visibility: project.visibility,
        },
      }
    : undefined;
  const authorization = {
    isAllowed: Boolean(scope) && can("projects.update", scope),
  };

  if (!project) {
    redirect(paths.projects());
  }

  return (
    <AuthorizationBoundary
      isAllowed={authorization.isAllowed}
      title="Project settings restricted"
      description="Only organization admins and owners can update project settings."
    >
      <GeneralSection
        project={{
          name: project.name,
          slug: project.slug,
          description: project.description,
          teamId: project.teamId,
          teamName: project.teamName,
          teamColor: project.teamColor,
          status: project.status,
          owner: project.owner ?? "Unknown owner",
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        }}
      />
    </AuthorizationBoundary>
  );
}
