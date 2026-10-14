"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";

import { authClient } from "@zentro/auth/client";
import { Logo, LogoMark } from "@zentro/ui/components/logo";
import { OrgSwitcher } from "@zentro/ui/components/org-switcher";
import { toastError } from "@zentro/ui/index";
import { useActiveBox } from "@zentro/ui/lib/use-active-box";
import {
  Sidebar,
  SidebarContent,
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

export function AppSidebar({ modules, organizations, activeOrgSlug }: Props) {
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
      <SidebarHeader className="gap-3 px-2.5 py-2.5">
        <Link
          href={paths.dashboard()}
          aria-label="Zentro home"
          className="flex h-8 items-center rounded-md px-1.5 outline-none focus-visible:ring-2 focus-visible:ring-ring group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
        >
          <span className="group-data-[collapsible=icon]:hidden">
            <Logo />
          </span>
          <LogoMark
            aria-hidden="true"
            title=""
            className="hidden size-6 text-signal group-data-[collapsible=icon]:block"
          />
        </Link>
        <OrgSwitcher
          organizations={organizations}
          activeOrgSlug={activeOrgSlug}
          createOrganizationHref={paths.auth.createOrganization()}
          onSwitchOrganization={switchOrganization}
        />
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
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
              {modules.map((item) => {
                const Icon = getModuleIcon(item.icon);
                const isActive = item.id === active?.id;

                return (
                  <SidebarMenuItem key={item.id} className="relative z-[1]">
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                      className="h-(--nav-item) text-ink-2 hover:bg-hover hover:text-ink data-active:bg-transparent data-active:font-medium data-active:text-signal"
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
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
