"use client";

import { useTrpcClient } from "@zentro/api/react";
import {
  ProjectList,
  type ProjectListItem,
} from "~/src/components/projects/list";
import { ProjectToolbar } from "~/src/components/projects/toolbar";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toastError } from "@zentro/ui/index";

type ProjectSort = "updated" | "name" | "status";

function getInitialStatus(value: string | null) {
  return value === "active" || value === "archived" ? value : "all";
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<ProjectSort>("updated");
  const [isLoading, setIsLoading] = useState(true);
  const trpc = useTrpcClient();
  const searchParams = useSearchParams();
  const initialStatus = getInitialStatus(searchParams.get("status"));

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
    <section className="flex w-full flex-col gap-6">
      <ProjectToolbar
        searchQuery={searchQuery}
        sortBy={sortBy}
        onSearchQueryChange={setSearchQuery}
        onSortByChange={setSortBy}
        onProjectCreated={loadProjects}
      />
      <ProjectList
        isLoading={isLoading}
        projects={projects}
        searchQuery={searchQuery}
        sortBy={sortBy}
        initialStatus={initialStatus}
      />
    </section>
  );
}
