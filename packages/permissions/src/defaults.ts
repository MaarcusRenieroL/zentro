import { getCatalog } from "./catalog";
import type { PermissionScope } from "@zentro/modules";

export type SystemRoleKey =
  | "owner"
  | "admin"
  | "member"
  | "team_lead"
  | "team_member"
  | "project_lead"
  | "project_member"
  | "project_viewer";

export type SystemRoleDefinition = {
  systemKey: SystemRoleKey;
  name: string;
  description: string;
  scope: PermissionScope;
  permissions: string[];
  /** Owner cannot be edited at all. */
  immutable?: boolean;
  /** Admin and Member can be edited per organization and reset to default. */
  editable: boolean;
};

const allKeys = () => getCatalog().map((entry) => entry.key);

// What a member could do before roles were configurable: see everything,
// work with tasks and docs, and nothing administrative.
const taskWork = [
  "tasks.view",
  "tasks.create",
  "tasks.update_own",
  "tasks.update_any",
  "tasks.delete_own",
  "tasks.delete_any",
  "tasks.assign",
  "tasks.comment",
  "tasks.activity.view",
];

const chatWork = [
  "chat.view",
  "chat.post",
  "chat.channels.create",
  "chat.files.upload",
];

const fileWork = ["files.view", "files.upload", "files.delete_own"];

const docWork = [
  "docs.view",
  "docs.create",
  "docs.update_own",
  "docs.update_any",
  "docs.trash_own",
  "docs.trash_any",
  "docs.restore",
  "docs.comment",
  "docs.search",
];

export function getSystemRoleDefinitions(): SystemRoleDefinition[] {
  return [
    {
      systemKey: "owner",
      name: "Owner",
      description: "Full control of the organization. Cannot be changed.",
      scope: "organization",
      permissions: allKeys(),
      immutable: true,
      editable: false,
    },
    {
      systemKey: "admin",
      name: "Admin",
      description: "Manages the organization, except owner-only actions.",
      scope: "organization",
      permissions: getCatalog()
        .filter((entry) => !entry.ownerOnly)
        .map((entry) => entry.key),
      editable: true,
    },
    {
      systemKey: "member",
      name: "Member",
      description: "Works with tasks and docs and can see the organization.",
      scope: "organization",
      permissions: [
        "members.view",
        "teams.view",
        "projects.view",
        ...taskWork,
        ...docWork,
        ...chatWork,
        ...fileWork,
        "modules.view",
      ],
      editable: true,
    },
    {
      systemKey: "team_lead",
      name: "Team lead",
      description: "Manages the members of a team.",
      scope: "team",
      permissions: ["teams.view", "teams.members.manage"],
      editable: false,
    },
    {
      systemKey: "team_member",
      name: "Team member",
      description: "Belongs to a team.",
      scope: "team",
      permissions: ["teams.view"],
      editable: false,
    },
    {
      systemKey: "project_lead",
      name: "Project lead",
      description: "Runs a project: settings, members, tasks and docs.",
      scope: "project",
      permissions: [
        "projects.view",
        "projects.update",
        "projects.archive",
        "projects.settings.manage",
        "projects.members.manage",
        ...taskWork,
        ...docWork,
      ],
      editable: false,
    },
    {
      systemKey: "project_member",
      name: "Project member",
      description: "Creates and edits tasks and docs in a project.",
      scope: "project",
      permissions: [
        "projects.view",
        "tasks.view",
        "tasks.create",
        "tasks.update_own",
        "tasks.update_any",
        "tasks.assign",
        "tasks.comment",
        "tasks.activity.view",
        "docs.view",
        "docs.create",
        "docs.update_own",
        "docs.update_any",
        "docs.comment",
        "docs.search",
      ],
      editable: false,
    },
    {
      systemKey: "project_viewer",
      name: "Project viewer",
      description: "Read-only access to a project.",
      scope: "project",
      permissions: [
        "projects.view",
        "tasks.view",
        "tasks.activity.view",
        "docs.view",
        "docs.search",
      ],
      editable: false,
    },
  ];
}

export function getSystemRoleDefinition(systemKey: string) {
  return getSystemRoleDefinitions().find(
    (definition) => definition.systemKey === systemKey,
  );
}
