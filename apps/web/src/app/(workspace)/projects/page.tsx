"use client";

import { useTrpcClient } from "@zentro/api/react";
import { ProjectList } from "~/src/components/projects/list";
import { ProjectToolbar } from "~/src/components/projects/toolbar";
import { useCallback, useEffect, useState } from "react";
import { toastError } from "@zentro/ui/index";
import type { Project } from "@zentro/db/schema";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const trpc = useTrpcClient();

  const loadProjects = useCallback(async () => {
    setIsLoading(true);

    try {
      const data = await trpc.project.getProjectsByOrgId.query();

      setProjects(data);
    } catch {
      toastError("Error", "Could not load existing projects");
    } finally {
      setIsLoading(false);
    }
  }, [trpc]);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  return (
    <section className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:gap-8 xl:px-10">
      <ProjectToolbar onProjectCreated={loadProjects} />
      <ProjectList isLoading={isLoading} projects={projects} />
    </section>
  );
}
