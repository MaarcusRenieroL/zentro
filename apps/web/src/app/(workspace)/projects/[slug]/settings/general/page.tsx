"use client";

import { useTrpcClient } from "@zentro/api/react";
import { toastError } from "@zentro/ui/index";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GeneralSection } from "~/src/components/project-detail/settings/general-section";
import { ProjectDetail } from "~/src/lib/types";

export default function GeneralSettingsPage() {
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
    return <div className="h-96 rounded-md border bg-card/50" />;
  }

  return (
    <GeneralSection
      project={{
        name: project.name,
        slug: project.slug,
        description: project.description,
        status: project.status,
        owner: project.owner,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      }}
    />
  );
}
