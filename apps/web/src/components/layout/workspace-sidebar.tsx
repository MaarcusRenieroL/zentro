"use client";

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
  SettingsIcon,
  ShieldIcon,
  Trash2Icon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react";
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
  SidebarRail,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@zentro/ui/shadcn/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@zentro/ui/shadcn/collapsible";
import Link from "next/link";
import { usePathname } from "next/navigation";

import type { LucideIcon } from "lucide-react";

type SidebarItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
  children?: SidebarItem[];
};

type SidebarSection = {
  label: string;
  items: SidebarItem[];
};

const sidebarSections: SidebarSection[] = [
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
        disabled: true,
        children: [
          {
            label: "All projects",
            href: "/projects",
            icon: GaugeIcon,
            disabled: true,
          },
          {
            label: "Active projects",
            href: "/projects?status=active",
            icon: CheckCircle2Icon,
            disabled: true,
          },
          {
            label: "Archived projects",
            href: "/projects?status=archived",
            icon: ArchiveIcon,
            disabled: true,
          },
        ],
      },
      {
        label: "Tasks",
        href: "/tasks",
        icon: ListChecksIcon,
        disabled: true,
        children: [
          {
            label: "My tasks",
            href: "/tasks?assignee=me",
            icon: UsersIcon,
            disabled: true,
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
        href: "/docs",
        icon: BookOpenIcon,
        disabled: true,
        children: [
          {
            label: "All docs",
            href: "/docs",
            icon: FileTextIcon,
            disabled: true,
          },
          {
            label: "Shared with me",
            href: "/docs/shared",
            icon: UsersIcon,
            disabled: true,
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

function isActivePath(pathname: string, href: string) {
  const basePath = href.split("?")[0];

  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}

export const WorkspaceSidebar = () => {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-3 py-3">
        <Link
          href="/dashboard"
          className="flex min-w-0 items-center gap-3 rounded-md px-1 py-1.5 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
            Z
          </span>
          <span className="min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="block truncate text-sm font-semibold text-sidebar-foreground">
              Zentro
            </span>
            <span className="block truncate text-xs text-sidebar-foreground/60">
              Workspace
            </span>
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        {sidebarSections.map((section) => (
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
                            <Link
                              href={item.disabled ? "#" : item.href}
                              aria-disabled={item.disabled}
                              tabIndex={item.disabled ? -1 : undefined}
                            >
                              <ItemIcon />
                              <span>{item.label}</span>
                              {item.disabled ? (
                                <span className="ml-auto text-[0.62rem] font-medium text-sidebar-foreground/35 group-data-[collapsible=icon]:hidden">
                                  Soon
                                </span>
                              ) : null}
                            </Link>
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
                                      className="h-8"
                                    >
                                      <Link
                                        href={child.disabled ? "#" : child.href}
                                        aria-disabled={child.disabled}
                                        tabIndex={
                                          child.disabled ? -1 : undefined
                                        }
                                      >
                                        <ChildIcon />
                                        <span>{child.label}</span>
                                      </Link>
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
