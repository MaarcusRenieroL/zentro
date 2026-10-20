import {
  chatPermissions,
  docsPermissions,
  projectsPermissions,
  settingsPermissions,
  tasksPermissions,
} from "./permission-definitions";
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
    permissionNamespaces: [],
    permissions: [],
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
    permissionNamespaces: [
      "org",
      "members",
      "invitations",
      "teams",
      "roles",
      "permissions",
      "audit_logs",
      "activity",
    ],
    permissions: settingsPermissions,
    nav: [
      {
        id: "organization",
        label: "Organization",
        order: 30,
        items: [
          {
            label: "Members",
            href: "/settings/organization/members",
            permission: "members.view",
            icon: "Users",
          },
          {
            label: "Teams",
            href: "/settings/organization/teams",
            permission: "teams.view",
            icon: "Shield",
          },
          {
            label: "Invitations",
            href: "/settings/organization/invitations",
            permission: "invitations.view",
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
            permission: "org.settings.update",
            icon: "Settings",
          },
          {
            label: "Modules",
            href: "/settings/organization/modules",
            permission: "modules.view",
            icon: "Blocks",
          },
          {
            label: "Audit log",
            href: "/settings/organization/audit-log",
            permission: "audit_logs.view",
            icon: "ScrollText",
          },
          {
            label: "Danger zone",
            href: "/settings/organization/danger",
            permission: "org.delete",
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
    permissionNamespaces: ["projects"],
    permissions: projectsPermissions,
    nav: [
      {
        id: "work",
        label: "Work",
        order: 20,
        items: [
          {
            label: "Projects",
            href: "/projects",
            permission: "projects.view",
            icon: "Folder",
            children: [
              {
                label: "All",
                href: "/projects",
                permission: "projects.view",
                icon: "Gauge",
              },
              {
                label: "Active",
                href: "/projects?status=active",
                permission: "projects.view",
                icon: "CheckCircle2",
              },
              {
                label: "Archived",
                href: "/projects?status=archived",
                permission: "projects.view",
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
    permissionNamespaces: ["tasks"],
    permissions: tasksPermissions,
    nav: [
      {
        id: "work",
        label: "Work",
        order: 20,
        items: [
          {
            label: "Tasks",
            href: "/tasks",
            permission: "tasks.view",
            icon: "ListChecks",
            children: [
              {
                label: "All tasks",
                href: "/tasks",
                permission: "tasks.view",
                icon: "Users",
              },
              {
                label: "Overview",
                href: "/tasks/overview",
                permission: "tasks.view",
                icon: "Gauge",
              },
              {
                label: "Completed",
                href: "/tasks?status=done",
                permission: "tasks.view",
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
    permissionNamespaces: ["docs"],
    permissions: docsPermissions,
    nav: [
      {
        id: "work",
        label: "Work",
        order: 20,
        items: [
          {
            label: "Docs",
            href: "/docs",
            permission: "docs.view",
            icon: "BookOpen",
            children: [
              {
                label: "All docs",
                href: "/docs",
                permission: "docs.view",
                icon: "FileText",
              },
              {
                label: "My docs",
                href: "/docs/my-docs",
                permission: "docs.view",
                icon: "Star",
              },
              {
                label: "Recent",
                href: "/docs/recent",
                permission: "docs.view",
                icon: "Calendar",
              },
              {
                label: "Project docs",
                href: "/docs/projects",
                permission: "docs.view",
                icon: "Folder",
              },
              {
                label: "Trash",
                href: "/docs/trash",
                permission: "docs.view",
                icon: "Trash2",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "chat",
    name: "Chat",
    description:
      "Channels and direct messages next to the work, linked to tasks and projects.",
    icon: "MessageSquare",
    basePath: "/chat",
    core: false,
    defaultEnabled: true,
    dependsOn: [],
    permissionNamespaces: ["chat"],
    permissions: chatPermissions,
    nav: [
      {
        id: "work",
        label: "Work",
        order: 20,
        items: [
          {
            label: "Chat",
            href: "/chat",
            permission: "chat.view",
            icon: "MessageSquare",
            children: [
              {
                label: "Mentions",
                href: "/chat/mentions",
                permission: "chat.view",
                icon: "AtSign",
              },
              {
                label: "Search messages",
                href: "/chat/search",
                permission: "chat.view",
                icon: "Search",
              },
            ],
          },
        ],
      },
    ],
  },
];
