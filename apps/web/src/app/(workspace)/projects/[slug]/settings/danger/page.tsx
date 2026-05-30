import { JSX } from "react";
import { db } from "@zentro/db";
import { and, eq } from "@zentro/db/drizzle";
import { projects } from "@zentro/db/schema";
import { redirect } from "next/navigation";

import { DangerSection } from "~/src/components/project-detail/settings/danger-section";
import { AuthorizationBoundary } from "~/src/components/workspace/authorization/authorization-boundary";
import { getAuthorizedDashboardContext } from "~/src/lib/dashboard-context";

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
  const { authorization, organization } = await getAuthorizedDashboardContext({
    project: ["archive", "delete"],
  });

  const [project] = await db
    .select({
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

  if (!project) {
    redirect("/projects");
  }

  return (
    <AuthorizationBoundary
      isAllowed={authorization.isAllowed}
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
