import type { ModuleManifest } from "./types";

// Registration order decides the order of items inside a nav section.
export const moduleRegistry: readonly ModuleManifest[] = [
  {
    id: "dashboard",
    name: "Dashboard",
    description: "Workspace overview, activity and quick actions.",
    icon: "LayoutDashboard",
    basePath: "/dashboard",
    core: true,
    defaultEnabled: true,
    dependsOn: [],
    nav: [
      {
        id: "workspace",
        label: "Workspace",
        order: 10,
        items: [
          { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
        ],
      },
    ],
  },
  {
    id: "settings",
    name: "Organization settings",
    description: "Organization details, members, teams and invitations.",
    icon: "Settings",
    basePath: "/settings",
    core: true,
    defaultEnabled: true,
    dependsOn: [],
    nav: [
      {
        id: "organization",
        label: "Organization",
        order: 30,
        items: [
          {
            label: "Members",
            href: "/settings/organization/members",
            icon: "Users",
          },
          {
            label: "Teams",
            href: "/settings/organization/teams",
            icon: "Shield",
          },
          {
            label: "Invitations",
            href: "/settings/organization/invitations",
            icon: "UserPlus",
          },
        ],
      },
      {
        id: "settings",
        label: "Settings",
        order: 40,
        items: [
          {
            label: "General",
            href: "/settings/organization/general",
            icon: "Settings",
          },
          {
            label: "Modules",
            href: "/settings/organization/modules",
            icon: "Blocks",
          },
          {
            label: "Danger zone",
            href: "/settings/organization/danger",
            icon: "Trash2",
          },
        ],
      },
    ],
  },
  {
    id: "projects",
    name: "Projects",
    description: "Plan and track projects across your organization.",
    icon: "Folder",
    basePath: "/projects",
    core: false,
    defaultEnabled: true,
    dependsOn: [],
    nav: [
      {
        id: "work",
        label: "Work",
        order: 20,
        items: [
          {
            label: "Projects",
            href: "/projects",
            icon: "Folder",
            children: [
              { label: "All projects", href: "/projects", icon: "Gauge" },
              {
                label: "Active projects",
                href: "/projects?status=active",
                icon: "CheckCircle2",
              },
              {
                label: "Archived projects",
                href: "/projects?status=archived",
                icon: "Archive",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "tasks",
    name: "Tasks",
    description:
      "Create, assign and track tasks on boards, lists and calendars.",
    icon: "ListChecks",
    basePath: "/tasks",
    core: false,
    defaultEnabled: true,
    dependsOn: ["projects"],
    nav: [
      {
        id: "work",
        label: "Work",
        order: 20,
        items: [
          {
            label: "Tasks",
            href: "/tasks",
            icon: "ListChecks",
            children: [
              { label: "All tasks", href: "/tasks", icon: "Users" },
              {
                label: "Overview",
                href: "/tasks/overview",
                icon: "Gauge",
              },
              {
                label: "Completed",
                href: "/tasks?status=done",
                icon: "CheckCircle2",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "docs",
    name: "Docs",
    description: "Write, organize and discuss documentation.",
    icon: "BookOpen",
    basePath: "/docs",
    core: false,
    defaultEnabled: true,
    dependsOn: [],
    nav: [
      {
        id: "work",
        label: "Work",
        order: 20,
        items: [
          {
            label: "Docs",
            href: "/docs",
            icon: "BookOpen",
            children: [
              { label: "All docs", href: "/docs", icon: "FileText" },
              { label: "My docs", href: "/docs/my-docs", icon: "Star" },
              { label: "Recent", href: "/docs/recent", icon: "Calendar" },
              { label: "Project docs", href: "/docs/projects", icon: "Folder" },
              { label: "Trash", href: "/docs/trash", icon: "Trash2" },
            ],
          },
        ],
      },
    ],
  },
];
