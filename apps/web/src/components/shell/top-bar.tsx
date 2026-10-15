"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ChevronDownIcon,
  FileTextIcon,
  LayoutGridIcon,
  MenuIcon,
  PlusIcon,
  SearchIcon,
  SquareCheckIcon,
} from "lucide-react";

import { Breadcrumbs } from "@zentro/ui/components/breadcrumbs";
import { Kbd } from "@zentro/ui/components/kbd";
import { Button } from "@zentro/ui/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@zentro/ui/shadcn/dropdown-menu";
import { SidebarTrigger, useSidebar } from "@zentro/ui/shadcn/sidebar";

import { NotificationBell } from "~/src/components/notifications/notification-bell";
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
import { isRecentPath, useRecent } from "./use-recent";
import { OPEN_PALETTE_EVENT } from "~/src/components/system/open-palette-button";
import { useShell } from "./shell-context";
import { UserMenu } from "./user-menu";

type Props = {
  orgName?: string;
  enabledModules: string[];
  modules: ShellModule[];
  user: { name: string; email: string };
  links: { settingsHref: string | null; membersHref: string | null };
};

export function TopBar({
  orgName,
  enabledModules,
  modules,
  user,
  links,
}: Props) {
  const { toggleSidebar } = useSidebar();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const pathname = usePathname();
  const crumbs = useCrumbs();

  const { record } = useRecent();
  const entries = getBreadcrumbs(pathname, crumbs);
  const current = entries[entries.length - 1];

  // Remember tasks, docs and projects once their real name has loaded.
  useEffect(() => {
    if (isRecentPath(pathname) && current && !current.loading) {
      record({ href: pathname, label: current.label });
    }
  }, [pathname, current?.label, current?.loading, record]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pages without access to this state (404) open the palette by event.
  useEffect(() => {
    const open = () => setPaletteOpen(true);

    window.addEventListener(OPEN_PALETTE_EVENT, open);

    return () => window.removeEventListener(OPEN_PALETTE_EVENT, open);
  }, []);
  const { refreshPage } = useShell();
  const [creating, setCreating] = useState<"task" | "project" | "doc" | null>(
    null,
  );
  const canTask =
    useReachable("tasks.create") && enabledModules.includes("tasks");
  const canDoc = useReachable("docs.create") && enabledModules.includes("docs");
  const canProject =
    usePermission("projects.create") && enabledModules.includes("projects");

  const createItems = [
    canTask
      ? {
          id: "task" as const,
          label: "New task",
          key: "C",
          Icon: SquareCheckIcon,
          tint: "bg-tint-tasks",
        }
      : null,
    canDoc
      ? {
          id: "doc" as const,
          label: "New doc",
          key: "D",
          Icon: FileTextIcon,
          tint: "bg-tint-docs",
        }
      : null,
    canProject
      ? {
          id: "project" as const,
          label: "New project",
          key: "P",
          Icon: LayoutGridIcon,
          tint: "bg-tint-projects",
        }
      : null,
  ].filter((item) => item !== null);
  // The trail starts at the organization, as the sidebar does.
  const trail = orgName
    ? [{ label: orgName, href: paths.dashboard() }, ...entries]
    : entries;

  return (
    <header
      data-slot="top-bar"
      className="sticky top-0 z-(--z-sticky) flex h-[52px] items-center gap-1.5 border-b border-hairline bg-canvas/85 px-2.5 backdrop-blur-md md:h-12 md:gap-2.5 md:px-4"
    >
      <SidebarTrigger className="hidden size-8 md:inline-flex" />
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        aria-label="Open navigation"
        className="size-10 text-ink md:hidden"
      >
        <MenuIcon className="size-[18px]" />
      </Button>
      <div className="hidden min-w-0 flex-1 md:block">
        <Breadcrumbs LinkComponent={Link} items={trail} />
      </div>
      <span className="min-w-0 flex-1 truncate text-base font-semibold md:hidden">
        {current?.label}
      </span>
      <div className="ml-auto flex items-center gap-1.5 md:gap-2.5">
        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          aria-label="Open command palette"
          className="hidden h-8 w-[300px] items-center gap-2 rounded-md border border-hairline bg-surface px-2.5 text-left text-[13px] text-ink-3 outline-none transition-colors hover:border-ink-3 focus-visible:ring-2 focus-visible:ring-ring lg:flex"
        >
          <SearchIcon className="size-4" aria-hidden="true" />
          <span className="flex-1 truncate">Search or jump to</span>
          <Kbd>⌘K</Kbd>
        </button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setPaletteOpen(true)}
          aria-label="Jump to a page"
          className="size-10 lg:hidden"
        >
          <SearchIcon className="size-[18px]" />
        </Button>
        {createItems.length ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                // One filled primary per screen: the page owns it, so the
                // global Create is always the quiet one.
                variant="outline"
                className="hidden h-8 border-hairline bg-transparent px-2.5 text-[13px] md:inline-flex"
              >
                <PlusIcon />
                Create
                <ChevronDownIcon className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-58 min-w-58 rounded-2xl p-1.5"
            >
              {createItems.map(({ id, label, key, Icon, tint }) => (
                <DropdownMenuItem
                  key={id}
                  onSelect={() => setCreating(id)}
                  className="h-10 gap-2.5 rounded-md px-2.5 text-sm"
                >
                  <span
                    aria-hidden="true"
                    className={`flex size-[26px] items-center justify-center rounded-sm border border-hairline text-ink ${tint}`}
                  >
                    <Icon className="size-3.5" />
                  </span>
                  {label}
                  <Kbd className="ml-auto">{key}</Kbd>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
        <NotificationBell />
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
                  key: "C",
                  run: () => setCreating("task"),
                },
              ]
            : []),
          ...(canDoc
            ? [
                {
                  id: "doc",
                  label: "New doc",
                  key: "D",
                  run: () => setCreating("doc"),
                },
              ]
            : []),
          ...(canProject
            ? [
                {
                  id: "project",
                  label: "New project",
                  key: "P",
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
