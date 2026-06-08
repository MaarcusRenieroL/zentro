"use client";

import { ComponentType, FC, ReactNode } from "react";
import {
  ArchiveIcon,
  BellIcon,
  BookOpenIcon,
  CalendarIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  CreditCardIcon,
  FileTextIcon,
  FolderIcon,
  GaugeIcon,
  InboxIcon,
  LayoutDashboardIcon,
  ListChecksIcon,
  StarIcon,
  SettingsIcon,
  ShieldIcon,
  Trash2Icon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react";

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

export type WorkspaceSidebarApp = "workspace" | "tasks" | "docs";

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
  app?: WorkspaceSidebarApp;
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
  sections?: WorkspaceSidebarSection[];
  brand?: WorkspaceSidebarBrand;
  soonLabel?: string;
  isActivePath?: (pathname: string, href: string) => boolean;
};

export const zentroWorkspaceSidebarSections: WorkspaceSidebarSection[] = [
  {
    label: "Workspace",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboardIcon,
      },
      {
        label: "Inbox",
        href: "/inbox",
        icon: InboxIcon,
        disabled: true,
      },
      {
        label: "Notifications",
        href: "/notifications",
        icon: BellIcon,
        disabled: true,
      },
    ],
  },
  {
    label: "Work",
    items: [
      {
        label: "Projects",
        href: "/projects",
        icon: FolderIcon,
        children: [
          {
            label: "All projects",
            href: "/projects",
            icon: GaugeIcon,
          },
          {
            label: "Active projects",
            href: "/projects?status=active",
            icon: CheckCircle2Icon,
          },
          {
            label: "Archived projects",
            href: "/projects?status=archived",
            icon: ArchiveIcon,
          },
        ],
      },
      {
        label: "Tasks",
        href: "/tasks",
        icon: ListChecksIcon,
        children: [
          {
            label: "My tasks",
            href: "/tasks",
            icon: UsersIcon,
          },
          {
            label: "Due today",
            href: "/tasks?due=today",
            icon: CalendarIcon,
            disabled: true,
          },
          {
            label: "Upcoming",
            href: "/tasks?due=upcoming",
            icon: CalendarIcon,
            disabled: true,
          },
          {
            label: "Completed",
            href: "/tasks?status=completed",
            icon: CheckCircle2Icon,
            disabled: true,
          },
        ],
      },
      {
        label: "Calendar",
        href: "/calendar",
        icon: CalendarIcon,
        disabled: true,
      },
      {
        label: "Docs",
        href: "/",
        icon: BookOpenIcon,
        app: "docs",
        children: [
          {
            label: "All docs",
            href: "/",
            icon: FileTextIcon,
            app: "docs",
          },
          {
            label: "My docs",
            href: "/my-docs",
            icon: StarIcon,
            app: "docs",
          },
          {
            label: "Recent",
            href: "/recent",
            icon: CalendarIcon,
            app: "docs",
          },
          {
            label: "Project docs",
            href: "/projects",
            icon: FolderIcon,
            app: "docs",
          },
          {
            label: "Trash",
            href: "/trash",
            icon: Trash2Icon,
            app: "docs",
          },
        ],
      },
    ],
  },
  {
    label: "Organization",
    items: [
      {
        label: "Members",
        href: "/settings/organization/members",
        icon: UsersIcon,
      },
      {
        label: "Teams",
        href: "/settings/organization/teams",
        icon: ShieldIcon,
      },
      {
        label: "Invitations",
        href: "/settings/organization/invitations",
        icon: UserPlusIcon,
      },
      {
        label: "Roles & permissions",
        href: "/settings/organization/roles",
        icon: ShieldIcon,
        disabled: true,
      },
    ],
  },
  {
    label: "Settings",
    items: [
      {
        label: "General",
        href: "/settings/organization/general",
        icon: SettingsIcon,
      },
      {
        label: "Billing",
        href: "/settings/billing",
        icon: CreditCardIcon,
        disabled: true,
      },
      {
        label: "Danger zone",
        href: "/settings/organization/danger",
        icon: Trash2Icon,
      },
    ],
  },
];

type CreateWorkspaceSidebarSectionsInput = {
  orgSlug: string;
  getOrgAppUrl: (input: {
    orgSlug: string;
    app: WorkspaceSidebarApp;
    path?: string;
  }) => string;
  sections?: WorkspaceSidebarSection[];
};

const appByPath: Record<string, WorkspaceSidebarApp> = {
  "/dashboard": "workspace",
  "/inbox": "workspace",
  "/notifications": "workspace",
  "/projects": "workspace",
  "/tasks": "tasks",
  "/calendar": "tasks",
  "/docs": "docs",
  "/my-docs": "docs",
  "/recent": "docs",
  "/search": "docs",
  "/trash": "docs",
  "/settings": "workspace",
};

function getAppForHref(item: WorkspaceSidebarItem): WorkspaceSidebarApp {
  if (item.app) {
    return item.app;
  }

  const pathname = item.href.split("?")[0] ?? item.href;
  const pathKey = Object.keys(appByPath)
    .sort((a, b) => b.length - a.length)
    .find((key) => pathname === key || pathname.startsWith(`${key}/`));

  return pathKey ? (appByPath[pathKey] ?? "workspace") : "workspace";
}

function resolveSidebarItemHref({
  item,
  orgSlug,
  getOrgAppUrl,
}: {
  item: WorkspaceSidebarItem;
  orgSlug: string;
  getOrgAppUrl: CreateWorkspaceSidebarSectionsInput["getOrgAppUrl"];
}) {
  return getOrgAppUrl({
    orgSlug,
    app: getAppForHref(item),
    path: item.href,
  });
}

export function createWorkspaceSidebarSections({
  orgSlug,
  getOrgAppUrl,
  sections = zentroWorkspaceSidebarSections,
}: CreateWorkspaceSidebarSectionsInput): WorkspaceSidebarSection[] {
  return sections.map((section) => ({
    ...section,
    items: section.items.map((item) => ({
      ...item,
      href: resolveSidebarItemHref({ item, orgSlug, getOrgAppUrl }),
      children: item.children?.map((child) => ({
        ...child,
        href: resolveSidebarItemHref({ item: child, orgSlug, getOrgAppUrl }),
      })),
    })),
  }));
}

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
  sections = zentroWorkspaceSidebarSections,
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
                      const hasActiveChild = item.children?.some((child) =>
                        isActivePath(pathname, child.href),
                      );
                      const isActive =
                        isActivePath(pathname, item.href) ||
                        Boolean(hasActiveChild);
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
