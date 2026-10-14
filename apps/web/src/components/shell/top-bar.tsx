"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDownIcon, PlusIcon, SearchIcon } from "lucide-react";

import { Breadcrumbs } from "@zentro/ui/components/breadcrumbs";
import { NotificationPopover } from "@zentro/ui/components/notification-popover";
import { Kbd } from "@zentro/ui/components/kbd";
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

import type { ShellModule } from "./app-sidebar";
import { useCrumbs } from "./breadcrumb-context";
import { CommandPalette } from "./command-palette";
import { useShell } from "./shell-context";
import { UserMenu } from "./user-menu";

type Props = {
  enabledModules: string[];
  modules: ShellModule[];
  user: { name: string; email: string };
  links: { settingsHref: string | null; membersHref: string | null };
};

export function TopBar({ enabledModules, modules, user, links }: Props) {
  const [paletteOpen, setPaletteOpen] = useState(false);
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
      className="sticky top-0 z-(--z-sticky) flex h-12 items-center gap-3 border-b border-hairline bg-canvas/85 px-(--gutter) backdrop-blur-md"
    >
      <SidebarTrigger />
      <div className="hidden min-w-0 flex-1 sm:block">
        <Breadcrumbs
          LinkComponent={Link}
          items={getBreadcrumbs(pathname, crumbs)}
        />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          aria-label="Open command palette"
          className="hidden h-8 w-56 items-center gap-2 rounded-full border border-border-strong bg-surface px-3 text-left text-sm text-ink-3 outline-none transition-colors hover:border-ink-3 focus-visible:ring-2 focus-visible:ring-ring md:flex"
        >
          <SearchIcon className="size-3.5" aria-hidden="true" />
          <span className="flex-1 truncate">Search or jump to</span>
          <Kbd>⌘K</Kbd>
        </button>
        {canCreate ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                // One primary action per screen: on Today that is Start.
                variant={pathname === paths.dashboard() ? "outline" : "default"}
              >
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
        <UserMenu user={user} links={links} />
      </div>

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        modules={modules}
        actions={[
          ...(canTask
            ? [
                {
                  id: "task",
                  label: "New task",
                  run: () => setCreating("task"),
                },
              ]
            : []),
          ...(canDoc
            ? [{ id: "doc", label: "New doc", run: () => setCreating("doc") }]
            : []),
          ...(canProject
            ? [
                {
                  id: "project",
                  label: "New project",
                  run: () => setCreating("project"),
                },
              ]
            : []),
        ]}
      />

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
