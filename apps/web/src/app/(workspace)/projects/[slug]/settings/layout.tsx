"use client";

import { useTrpcClient } from "@zentro/api/react";
import { toastError } from "@zentro/ui/index";
import { useParams, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { SettingsShell } from "~/src/components/project-detail/settings/settings-shell";
import { ProjectDetail } from "~/src/lib/types";

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
        router.replace("/projects");
      }
    }

    void loadProject();

    return () => {
      isMounted = false;
    };
  }, [slug, router, trpc]);

  if (!project) {
    return null;
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
