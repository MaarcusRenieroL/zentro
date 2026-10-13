"use client";

import { ComponentType, FC, ReactNode } from "react";
import { ChevronRightIcon } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./shadcn/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "./shadcn/sidebar";

import type { LucideIcon } from "lucide-react";

export type WorkspaceSidebarLinkComponentProps = {
  href: string;
  children: ReactNode;
  className?: string;
  "aria-disabled"?: boolean;
  tabIndex?: number;
};

export type WorkspaceSidebarItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
  children?: WorkspaceSidebarItem[];
};

export type WorkspaceSidebarSection = {
  label: string;
  items: WorkspaceSidebarItem[];
};

export type WorkspaceSidebarBrand = {
  label?: string;
  subtitle?: string;
  href?: string;
  mark?: ReactNode;
};

export type WorkspaceSidebarProps = {
  pathname: string;
  LinkComponent: ComponentType<WorkspaceSidebarLinkComponentProps>;
  sections: WorkspaceSidebarSection[];
  brand?: WorkspaceSidebarBrand;
  soonLabel?: string;
  isActivePath?: (pathname: string, href: string) => boolean;
};

function getHrefPathname(href: string) {
  return new URL(href, "http://zentro.local").pathname;
}

function defaultIsActivePath(pathname: string, href: string) {
  const basePath = getHrefPathname(href);

  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}

export const WorkspaceSidebar: FC<WorkspaceSidebarProps> = ({
  pathname,
  LinkComponent,
  sections,
  brand = {},
  soonLabel = "Soon",
  isActivePath = defaultIsActivePath,
}) => {
  const {
    label = "Zentro",
    subtitle = "Workspace",
    href = "/dashboard",
    mark = "Z",
  } = brand;

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-3 py-3">
        <LinkComponent
          href={href}
          className="flex min-w-0 items-center gap-3 rounded-md px-1 py-1.5 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
            {mark}
          </span>
          <span className="min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="block truncate text-sm font-semibold text-sidebar-foreground">
              {label}
            </span>
            <span className="block truncate text-xs text-sidebar-foreground/60">
              {subtitle}
            </span>
          </span>
        </LinkComponent>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        {sections.map((section) => (
          <Collapsible
            key={section.label}
            defaultOpen
            className="group/collapsible"
          >
            <SidebarGroup className="px-0 py-1">
              <SidebarGroupLabel
                asChild
                className="h-7 px-2 text-[0.68rem] font-semibold uppercase tracking-wide text-sidebar-foreground/55 hover:bg-transparent hover:text-sidebar-foreground/80"
              >
                <CollapsibleTrigger className="flex w-full items-center">
                  <span className="truncate">{section.label}</span>
                  <ChevronRightIcon className="ml-auto size-3.5 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>

              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map((item) => {
                      // Only links are highlighted; a group with children is
                      // never active itself, so one item is active per route.
                      const isActive = item.children?.length
                        ? false
                        : isActivePath(pathname, item.href);
                      const ItemIcon = item.icon;

                      return (
                        <SidebarMenuItem key={item.label}>
                          <SidebarMenuButton
                            asChild
                            isActive={isActive}
                            disabled={item.disabled}
                            tooltip={item.label}
                            className={
                              item.disabled
                                ? "h-8 text-sidebar-foreground/45 hover:bg-transparent hover:text-sidebar-foreground/45"
                                : "h-8"
                            }
                          >
                            <LinkComponent
                              href={item.disabled ? "#" : item.href}
                              aria-disabled={item.disabled}
                              tabIndex={item.disabled ? -1 : undefined}
                            >
                              <ItemIcon />
                              <span>{item.label}</span>
                              {item.disabled ? (
                                <span className="ml-auto text-[0.62rem] font-medium text-sidebar-foreground/35 group-data-[collapsible=icon]:hidden">
                                  {soonLabel}
                                </span>
                              ) : null}
                            </LinkComponent>
                          </SidebarMenuButton>

                          {item.children && !item.disabled ? (
                            <SidebarMenuSub>
                              {item.children.map((child) => {
                                const ChildIcon = child.icon;

                                return (
                                  <SidebarMenuSubItem key={child.label}>
                                    <SidebarMenuSubButton
                                      asChild
                                      isActive={isActivePath(
                                        pathname,
                                        child.href,
                                      )}
                                      className={
                                        child.disabled
                                          ? "h-8 text-sidebar-foreground/45 hover:bg-transparent hover:text-sidebar-foreground/45"
                                          : "h-8"
                                      }
                                    >
                                      <LinkComponent
                                        href={child.disabled ? "#" : child.href}
                                        aria-disabled={child.disabled}
                                        tabIndex={
                                          child.disabled ? -1 : undefined
                                        }
                                      >
                                        <ChildIcon />
                                        <span>{child.label}</span>
                                        {child.disabled ? (
                                          <span className="ml-auto text-[0.62rem] font-medium text-sidebar-foreground/35">
                                            {soonLabel}
                                          </span>
                                        ) : null}
                                      </LinkComponent>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                );
                              })}
                            </SidebarMenuSub>
                          ) : null}
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
};
