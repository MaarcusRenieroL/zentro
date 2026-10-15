"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";

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
} from "@zentro/ui/shadcn/sidebar";

import { getModuleIcon } from "~/src/lib/module-icons";
import { paths } from "~/src/lib/paths";

export type ShellModule = {
  id: string;
  label: string;
  href: string;
  icon: string;
  /** Pages under this path belong to the module. */
  base: string;
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

  for (const item of modules) {
    if (pathname === item.base || pathname.startsWith(`${item.base}/`)) {
      if (!best || item.base.length > best.base.length) best = item;
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
      <SidebarHeader className="px-3 pt-3 pb-0">
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
          className="h-12 rounded-xl border border-hairline bg-surface px-2"
        />
      </SidebarHeader>

      <SidebarContent className="gap-0 px-3 pt-3.5 pb-3">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu ref={listRef} className="relative gap-0.5">
              {box ? (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute top-0 left-0 rounded-xl bg-selected transition-[transform,width,height] duration-[var(--duration-base)] ease-[var(--ease-out)]"
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
                  const Icon = getModuleIcon(item.icon);
                  const isActive = item.id === active?.id;

                  return (
                    <SidebarMenuItem key={item.id} className="relative z-[1]">
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.label}
                        className="h-9 rounded-xl text-ink-2 hover:bg-hover hover:text-ink data-active:bg-transparent data-active:font-medium data-active:text-ink"
                      >
                        <Link
                          href={item.href}
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
              const Icon = getModuleIcon(item.icon);
              const isActive = item.id === active?.id;

              return (
                <SidebarMenu key={item.id}>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                      className="h-9 rounded-xl text-ink-2 hover:bg-hover hover:text-ink data-active:bg-selected data-active:font-medium data-active:text-ink"
                    >
                      <Link
                        href={item.href}
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
