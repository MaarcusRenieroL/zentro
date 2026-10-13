"use client";

import { paths } from "~/src/lib/paths";
import { useTrpcClient } from "@zentro/api/react";
import { toastError } from "@zentro/ui/index";
import { useParams, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { SettingsShell } from "~/src/components/project-detail/settings/settings-shell";
import { ProjectDetail } from "~/src/lib/types";
import { ProjectSettingsLoading } from "~/src/components/project-detail/project-loading";

export default function ProjectSettingsLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const [project, setProject] = useState<ProjectDetail | null>(null);

  const trpc = useTrpcClient();
  const params = useParams<{ slug: string }>();
  const router = useRouter();

  const slug = params.slug;

  useEffect(() => {
    let isMounted = true;

    async function loadProject() {
      try {
        const data = await trpc.project.getProjectBySlug.query({
          slug,
        });

        if (isMounted) {
          setProject(data as ProjectDetail);
        }
      } catch {
        toastError("Error", "Project not found");
        router.replace(paths.projects());
      }
    }

    void loadProject();

    return () => {
      isMounted = false;
    };
  }, [slug, router, trpc]);

  if (!project) {
    return <ProjectSettingsLoading />;
  }

  return (
    <SettingsShell
      project={{
        name: project.name,
        slug: project.slug,
      }}
    >
      {children}
    </SettingsShell>
  );
}
