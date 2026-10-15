"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { XIcon } from "lucide-react";

import { authClient } from "@zentro/auth/client";
import { OrgSwitcher } from "@zentro/ui/components/org-switcher";
import { toastError } from "@zentro/ui/index";
import { useActiveBox } from "@zentro/ui/lib/use-active-box";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@zentro/ui/shadcn/sidebar";
import { cn } from "@zentro/ui/lib/utils";

import { getShellIcon } from "~/src/lib/module-icons";
import { paths } from "~/src/lib/paths";

export type ShellModule = {
  id: string;
  label: string;
  href: string;
  icon: string;
  /** Pages under this path belong to the module. */
  base: string;
  /** Other paths whose pages read as part of the module. */
  bases?: string[];
};

type Props = {
  modules: ShellModule[];
  organizations: Array<{ id: string; name: string; slug: string }>;
  activeOrgSlug: string;
  /** "Admin · 18 people" under the organization name. */
  orgSubtitle?: string;
  /** Open tasks assigned to the user, shown on the Tasks item. */
  taskCount?: number;
};

/** The module a path belongs to: the longest matching base wins. */
export function findActiveModule(modules: ShellModule[], pathname: string) {
  let best: ShellModule | null = null;

  let bestLength = 0;

  for (const item of modules) {
    for (const base of [item.base, ...(item.bases ?? [])]) {
      if (pathname === base || pathname.startsWith(`${base}/`)) {
        if (base.length > bestLength) {
          best = item;
          bestLength = base.length;
        }
      }
    }
  }

  return best;
}

export function AppSidebar({
  modules,
  organizations,
  activeOrgSlug,
  orgSubtitle,
  taskCount,
}: Props) {
  const pathname = usePathname();
  const active = findActiveModule(modules, pathname);
  const listRef = useRef<HTMLUListElement>(null);
  const box = useActiveBox(listRef, '[data-active="true"]');
  const { isMobile, setOpenMobile } = useSidebar();
  // On a phone the sidebar is a sheet: bigger targets, and it closes once
  // you pick a place.
  const itemSize = isMobile ? "h-11 text-[15px]" : "h-9";
  const close = () => {
    if (isMobile) setOpenMobile(false);
  };
  const switchOrganization = async (organizationId: string) => {
    const { error } = await authClient.organization.setActive({
      organizationId,
    });

    if (error) {
      toastError(error, "Could not switch organization");

      return;
    }

    // A full load, so every query starts from the new organization.
    window.location.assign(paths.dashboard());
  };

  return (
    <Sidebar collapsible="icon" variant="sidebar" aria-label="Main">
      <SidebarHeader className="flex-row items-center px-3 pt-3 pb-0">
        <OrgSwitcher
          organizations={organizations}
          activeOrgSlug={activeOrgSlug}
          createOrganizationHref={paths.auth.createOrganization()}
          onSwitchOrganization={switchOrganization}
          subtitle={orgSubtitle}
          mark={
            <span
              aria-hidden="true"
              className="flex size-[26px] shrink-0 items-center justify-center rounded-lg bg-ink"
            >
              <span className="h-[13px] w-0.5 rounded-xs bg-signal" />
            </span>
          }
          className={cn(
            "h-12 rounded-md border border-hairline bg-surface px-2",
            // The close button takes the chevron's place in the sheet.
            isMobile && "h-[52px] pr-11 [&>svg:last-child]:hidden",
          )}
        />
        {isMobile ? (
          <button
            type="button"
            onClick={close}
            aria-label="Close navigation"
            className="-ml-12 flex size-9 shrink-0 items-center justify-center rounded-md text-ink-2 outline-none hover:bg-hover focus-visible:ring-2 focus-visible:ring-ring"
          >
            <XIcon className="size-4" aria-hidden="true" />
          </button>
        ) : null}
      </SidebarHeader>

      <SidebarContent className="gap-0 px-3 pt-3.5 pb-3">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu ref={listRef} className="relative gap-0.5">
              {box ? (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute top-0 left-0 rounded-md bg-selected transition-[transform,width,height] duration-[var(--duration-base)] ease-[var(--ease-out)]"
                  style={{
                    width: box.width,
                    height: box.height,
                    transform: `translate(${box.left}px, ${box.top}px)`,
                  }}
                />
              ) : null}
              {modules
                .filter((item) => item.id !== "settings")
                .map((item) => {
                  const Icon = getShellIcon(item.id, item.icon);
                  const isActive = item.id === active?.id;

                  return (
                    <SidebarMenuItem key={item.id} className="relative z-[1]">
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.label}
                        className={cn(
                          itemSize,
                          "rounded-md text-ink-2 hover:bg-hover hover:text-ink data-active:bg-transparent data-active:font-medium data-active:text-ink",
                        )}
                      >
                        <Link
                          href={item.href}
                          onClick={close}
                          aria-current={isActive ? "page" : undefined}
                        >
                          <Icon
                            className={isActive ? "text-signal" : undefined}
                          />
                          <span className="flex-1">{item.label}</span>
                          {item.id === "tasks" && taskCount ? (
                            <span className="font-mono text-xs text-ink-3 group-data-[collapsible=icon]:hidden">
                              {taskCount}
                            </span>
                          ) : null}
                          {item.id === "overview" ? (
                            <span className="rounded-sm border border-hairline px-1.5 font-mono text-[10px] tracking-[0.06em] text-ink-2 group-data-[collapsible=icon]:hidden">
                              ADMIN
                            </span>
                          ) : null}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {modules.some((item) => item.id === "settings") ? (
        <SidebarFooter className="px-3 pt-0 pb-3">
          {modules
            .filter((item) => item.id === "settings")
            .map((item) => {
              const Icon = getShellIcon(item.id, item.icon);
              const isActive = item.id === active?.id;

              return (
                <SidebarMenu key={item.id}>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                      className={cn(
                        itemSize,
                        "rounded-md text-ink-2 hover:bg-hover hover:text-ink data-active:bg-selected data-active:font-medium data-active:text-ink",
                      )}
                    >
                      <Link
                        href={item.href}
                        onClick={close}
                        aria-current={isActive ? "page" : undefined}
                      >
                        <Icon
                          className={isActive ? "text-signal" : undefined}
                        />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              );
            })}
        </SidebarFooter>
      ) : null}

      <SidebarRail />
    </Sidebar>
  );
}
