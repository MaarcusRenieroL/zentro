import { paths } from "~/src/lib/paths";
import { JSX } from "react";
import { db } from "@zentro/db";
import { and, eq } from "@zentro/db/drizzle";
import { projects } from "@zentro/db/schema";
import { redirect } from "next/navigation";

import { DangerSection } from "~/src/components/project-detail/settings/danger-section";
import { AuthorizationBoundary } from "~/src/components/workspace/authorization/authorization-boundary";
import { getDashboardContext } from "~/src/lib/dashboard-context";

type ProjectStatus = "active" | "archived";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

const getProjectStatus = (status: string): ProjectStatus => {
  return status === "archived" ? "archived" : "active";
};

export default async function DangerSettingsPage({
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
      slug: projects.slug,
      status: projects.status,
    })
    .from(projects)
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
    isAllowed:
      Boolean(scope) &&
      can("projects.archive", scope) &&
      can("projects.delete", scope),
  };

  if (!project) {
    redirect(paths.projects());
  }

  return (
    <AuthorizationBoundary
      isAllowed={authorization.isAllowed}
      permission="projects.delete"
      title="Project management restricted"
      description="Only organization admins and owners can archive, restore, or delete projects."
    >
      <DangerSection
        project={{
          name: project.name,
          slug: project.slug,
          status: getProjectStatus(project.status),
        }}
      />
    </AuthorizationBoundary>
  );
}
