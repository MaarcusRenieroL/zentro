import { JSX } from "react";
import { db } from "@zentro/db";
import { and, eq } from "@zentro/db/drizzle";
import { projects, users } from "@zentro/db/schema";
import { redirect } from "next/navigation";

import { GeneralSection } from "~/src/components/project-detail/settings/general-section";
import { AuthorizationBoundary } from "~/src/components/workspace/authorization/authorization-boundary";
import { getAuthorizedDashboardContext } from "~/src/lib/dashboard-context";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function GeneralSettingsPage({
  params,
}: Props): Promise<JSX.Element> {
  const { slug } = await params;
  const { authorization, organization } = await getAuthorizedDashboardContext({
    project: ["update"],
  });

  const [project] = await db
    .select({
      name: projects.name,
      description: projects.description,
      slug: projects.slug,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      status: projects.status,
      owner: users.name,
    })
    .from(projects)
    .leftJoin(users, eq(users.id, projects.createdById))
    .where(
      and(
        eq(projects.slug, slug),
        eq(projects.organizationId, organization.id),
      ),
    )
    .limit(1);

  if (!project) {
    redirect("/projects");
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
          status: project.status,
          owner: project.owner ?? "Unknown owner",
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        }}
      />
    </AuthorizationBoundary>
  );
}
