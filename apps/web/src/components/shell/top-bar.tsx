"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDownIcon, PlusIcon } from "lucide-react";

import { Breadcrumbs } from "@zentro/ui/components/breadcrumbs";
import { NotificationPopover } from "@zentro/ui/components/notification-popover";
import { Button } from "@zentro/ui/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@zentro/ui/shadcn/dropdown-menu";
import { SidebarTrigger } from "@zentro/ui/shadcn/sidebar";

import {
  usePermission,
  useReachable,
} from "~/src/components/permissions/permission-provider";
import { CreateProjectModal } from "~/src/components/projects/create-project-modal";
import { CreateDocModal } from "~/src/features/docs/components/pages/home/create-doc-modal";
import { CreateTaskModal } from "~/src/features/tasks/components/create-task-modal";
import { getBreadcrumbs } from "~/src/lib/breadcrumbs";
import { paths } from "~/src/lib/paths";

import { useCrumbs } from "./breadcrumb-context";
import { useShell } from "./shell-context";

type Props = {
  enabledModules: string[];
};

export function TopBar({ enabledModules }: Props) {
  const pathname = usePathname();
  const crumbs = useCrumbs();
  const { refreshPage } = useShell();
  const [creating, setCreating] = useState<"task" | "project" | "doc" | null>(
    null,
  );
  const canTask =
    useReachable("tasks.create") && enabledModules.includes("tasks");
  const canDoc = useReachable("docs.create") && enabledModules.includes("docs");
  const canProject =
    usePermission("projects.create") && enabledModules.includes("projects");
  const canCreate = canTask || canDoc || canProject;

  return (
    <header
      data-slot="top-bar"
      className="sticky top-0 z-(--z-sticky) flex h-[calc(var(--control-h)+1.25rem)] items-center gap-3 rounded-t-2xl bg-surface/85 px-(--gutter) backdrop-blur-md"
    >
      <SidebarTrigger />
      <div className="hidden min-w-0 flex-1 sm:block">
        <Breadcrumbs
          LinkComponent={Link}
          items={getBreadcrumbs(pathname, crumbs)}
        />
      </div>
      <div className="ml-auto flex items-center gap-1.5">
        {canCreate ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm">
                <PlusIcon />
                Create
                <ChevronDownIcon className="opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 min-w-44">
              {canTask ? (
                <DropdownMenuItem onSelect={() => setCreating("task")}>
                  New task
                </DropdownMenuItem>
              ) : null}
              {canDoc ? (
                <DropdownMenuItem onSelect={() => setCreating("doc")}>
                  New doc
                </DropdownMenuItem>
              ) : null}
              {canProject ? (
                <DropdownMenuItem onSelect={() => setCreating("project")}>
                  New project
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
        <NotificationPopover />
      </div>

      {/* The existing create dialogs, opened from the menu. */}
      <CreateTaskModal
        hideTrigger
        open={creating === "task"}
        onOpenChange={(open) => !open && setCreating(null)}
        onTaskCreated={refreshPage}
      />
      <CreateDocModal
        hideTrigger
        open={creating === "doc"}
        onOpenChange={(open) => !open && setCreating(null)}
      />
      <CreateProjectModal
        hideTrigger
        open={creating === "project"}
        onOpenChange={(open) => !open && setCreating(null)}
        onProjectCreated={() => {
          if (pathname === paths.projects()) refreshPage();
        }}
      />
    </header>
  );
}
