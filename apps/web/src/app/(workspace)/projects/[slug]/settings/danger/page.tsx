"use client";

import { useTrpcClient } from "@zentro/api/react";
import { toastError } from "@zentro/ui/index";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DangerSection } from "~/src/components/project-detail/settings/danger-section";
import { ProjectDetail } from "~/src/lib/types";
import { ProjectSettingsContentLoading } from "~/src/components/project-detail/project-loading";

export default function DangerSettingsPage() {
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const trpc = useTrpcClient();
  const params = useParams<{ slug: string }>();
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    async function loadProject() {
      try {
        const data = await trpc.project.getProjectBySlug.query({
          slug: params.slug,
        });

        if (isMounted) {
          setProject(data as ProjectDetail);
        }
      } catch {
        toastError("Error", "Project not found");
        router.replace("/projects");
      }
    }

    void loadProject();

    return () => {
      isMounted = false;
    };
  }, [params.slug, router, trpc]);

  if (!project) {
    return <ProjectSettingsContentLoading />;
  }

  return (
    <DangerSection
      project={{
        name: project.name,
        slug: project.slug,
        status: project.status,
      }}
    />
  );
}
