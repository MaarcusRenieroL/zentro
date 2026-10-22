import type { PermissionDefinition, PermissionScope } from "./types";

const org: PermissionScope[] = ["organization"];
const orgTeam: PermissionScope[] = ["organization", "team"];
const all: PermissionScope[] = ["organization", "team", "project"];

type Options = { ownerOnly?: boolean; uiOnly?: string };

export function definePermission(
  key: string,
  label: string,
  description: string,
  group: string,
  scopes: PermissionScope[],
  options: Options = {},
): PermissionDefinition {
  return { key, label, description, group, scopes, ...options };
}

export const settingsPermissions: PermissionDefinition[] = [
  definePermission(
    "org.settings.view",
    "View organization settings",
    "Open the organization settings pages.",
    "Organization",
    org,
    {
      uiOnly: "Gates the settings pages in the UI; there is no API of its own.",
    },
  ),
  definePermission(
    "org.settings.update",
    "Update organization settings",
    "Change the organization name and details.",
    "Organization",
    org,
  ),
  definePermission(
    "org.delete",
    "Delete the organization",
    "Permanently delete the organization and all of its data.",
    "Organization",
    org,
    { ownerOnly: true },
  ),
  definePermission(
    "org.ownership.transfer",
    "Transfer ownership",
    "Make another member the owner.",
    "Organization",
    org,
    { ownerOnly: true },
  ),

  definePermission(
    "members.view",
    "View members",
    "See the member list.",
    "Members",
    org,
  ),
  definePermission(
    "members.invite",
    "Invite members",
    "Send invitations to join the organization.",
    "Members",
    org,
  ),
  definePermission(
    "members.remove",
    "Remove members",
    "Remove members from the organization.",
    "Members",
    org,
  ),
  definePermission(
    "members.role.update",
    "Change member roles",
    "Change a member's base organization role.",
    "Members",
    org,
  ),
  definePermission(
    "invitations.view",
    "View invitations",
    "See pending invitations.",
    "Members",
    org,
  ),
  definePermission(
    "invitations.cancel",
    "Cancel invitations",
    "Cancel pending invitations.",
    "Members",
    org,
  ),
  definePermission(
    "invitations.resend",
    "Resend invitations",
    "Send an invitation email again.",
    "Members",
    org,
  ),

  definePermission(
    "teams.view",
    "View teams",
    "See teams and their members.",
    "Teams",
    orgTeam,
  ),
  definePermission(
    "teams.create",
    "Create teams",
    "Create new teams.",
    "Teams",
    org,
  ),
  definePermission(
    "teams.update",
    "Update teams",
    "Rename and edit teams.",
    "Teams",
    orgTeam,
  ),
  definePermission(
    "teams.delete",
    "Delete teams",
    "Delete teams.",
    "Teams",
    orgTeam,
  ),
  definePermission(
    "teams.members.manage",
    "Manage team members",
    "Add and remove team members.",
    "Teams",
    orgTeam,
  ),

  definePermission(
    "roles.view",
    "View roles",
    "See roles, assignments and what they grant.",
    "Roles and permissions",
    org,
  ),
  definePermission(
    "roles.create",
    "Create roles",
    "Create and clone custom roles.",
    "Roles and permissions",
    org,
  ),
  definePermission(
    "roles.update",
    "Edit roles",
    "Change what a role grants.",
    "Roles and permissions",
    org,
  ),
  definePermission(
    "roles.delete",
    "Delete roles",
    "Delete custom roles that are not assigned.",
    "Roles and permissions",
    org,
  ),
  definePermission(
    "roles.assign",
    "Assign roles",
    "Give roles to members and teams, and take them away.",
    "Roles and permissions",
    all,
  ),
  definePermission(
    "permissions.overrides.manage",
    "Manage overrides",
    "Allow or deny single permissions for a member.",
    "Roles and permissions",
    all,
  ),
  definePermission(
    "permissions.log.view",
    "View the permission log",
    "See who changed roles and permissions.",
    "Roles and permissions",
    org,
  ),
  definePermission(
    "permissions.explain",
    "Check access",
    "Use the access check to see why someone can or cannot do something.",
    "Roles and permissions",
    org,
  ),
  definePermission(
    "audit_logs.view",
    "View the audit log",
    "See every recorded event in the organization, including sign-ins and permission changes.",
    "Audit",
    org,
  ),
  definePermission(
    "audit_logs.export",
    "Export the audit log",
    "Download the audit log as a CSV file.",
    "Audit",
    org,
  ),
  definePermission(
    "activity.view_org",
    "View organization activity",
    "See the organization-wide activity feed (what you can view stays visible without it).",
    "Audit",
    org,
  ),
];

export const projectsPermissions: PermissionDefinition[] = [
  definePermission(
    "projects.view",
    "View projects",
    "See projects the caller has access to.",
    "Projects",
    all,
  ),
  definePermission(
    "projects.view_private",
    "View private projects",
    "See private and team projects without being a member.",
    "Projects",
    all,
  ),
  definePermission(
    "projects.create",
    "Create projects",
    "Create new projects.",
    "Projects",
    org,
  ),
  definePermission(
    "projects.update",
    "Update projects",
    "Edit a project's name, slug and description.",
    "Projects",
    all,
  ),
  definePermission(
    "projects.archive",
    "Archive projects",
    "Archive projects.",
    "Projects",
    all,
  ),
  definePermission(
    "projects.restore",
    "Restore projects",
    "Bring archived projects back.",
    "Projects",
    all,
    { uiOnly: "Projects cannot be restored from the archive yet." },
  ),
  definePermission(
    "projects.delete",
    "Delete projects",
    "Delete projects.",
    "Projects",
    all,
  ),
  definePermission(
    "projects.members.manage",
    "Manage project members",
    "Give people and teams roles on a project.",
    "Projects",
    all,
  ),
  definePermission(
    "projects.settings.manage",
    "Manage project settings",
    "Change a project's visibility and owning team.",
    "Projects",
    all,
  ),
];

export const tasksPermissions: PermissionDefinition[] = [
  definePermission(
    "tasks.view",
    "View tasks",
    "See tasks and the task overview.",
    "Tasks",
    all,
  ),
  definePermission(
    "tasks.create",
    "Create tasks",
    "Create new tasks.",
    "Tasks",
    all,
  ),
  definePermission(
    "tasks.update_own",
    "Edit own tasks",
    "Edit tasks the user created.",
    "Tasks",
    all,
  ),
  definePermission(
    "tasks.update_any",
    "Edit any task",
    "Edit any task.",
    "Tasks",
    all,
  ),
  definePermission(
    "tasks.delete_own",
    "Delete own tasks",
    "Delete tasks the user created.",
    "Tasks",
    all,
  ),
  definePermission(
    "tasks.delete_any",
    "Delete any task",
    "Delete any task.",
    "Tasks",
    all,
  ),
  definePermission(
    "tasks.assign",
    "Assign tasks",
    "Change who a task is assigned to.",
    "Tasks",
    all,
  ),
  definePermission(
    "tasks.comment",
    "Comment on tasks",
    "Write comments on tasks.",
    "Tasks",
    all,
  ),
  definePermission(
    "tasks.activity.view",
    "View task activity",
    "See a task's history.",
    "Tasks",
    all,
  ),
];

export const docsPermissions: PermissionDefinition[] = [
  definePermission("docs.view", "View docs", "Read docs.", "Docs", all),
  definePermission(
    "docs.create",
    "Create docs",
    "Create new docs.",
    "Docs",
    all,
  ),
  definePermission(
    "docs.update_own",
    "Edit own docs",
    "Edit docs the user created.",
    "Docs",
    all,
  ),
  definePermission(
    "docs.update_any",
    "Edit any doc",
    "Edit any doc.",
    "Docs",
    all,
  ),
  definePermission(
    "docs.trash_own",
    "Trash own docs",
    "Move docs the user created to the trash.",
    "Docs",
    all,
  ),
  definePermission(
    "docs.trash_any",
    "Trash any doc",
    "Move any doc to the trash.",
    "Docs",
    all,
  ),
  definePermission(
    "docs.restore",
    "Restore docs",
    "Restore docs from the trash.",
    "Docs",
    all,
  ),
  definePermission(
    "docs.delete",
    "Delete docs permanently",
    "Permanently delete docs.",
    "Docs",
    all,
    { uiOnly: "Docs can only be moved to the trash for now." },
  ),
  definePermission(
    "docs.comment",
    "Comment on docs",
    "Write and resolve doc comments.",
    "Docs",
    all,
  ),
  definePermission("docs.search", "Search docs", "Search docs.", "Docs", all),
];

// Not owned by one module.
export const platformPermissions: PermissionDefinition[] = [
  definePermission(
    "modules.view",
    "View modules",
    "See which modules are turned on.",
    "Modules",
    org,
  ),
  definePermission(
    "modules.manage",
    "Manage modules",
    "Turn modules on and off.",
    "Modules",
    org,
  ),
  definePermission(
    "comments.update_own",
    "Edit own comments",
    "Edit comments the user wrote.",
    "Comments",
    all,
    { uiOnly: "Comments cannot be edited yet." },
  ),
  definePermission(
    "comments.update_any",
    "Edit any comment",
    "Edit any comment.",
    "Comments",
    all,
    { uiOnly: "Comments cannot be edited yet." },
  ),
  definePermission(
    "comments.delete_own",
    "Delete own comments",
    "Delete comments the user wrote.",
    "Comments",
    all,
    { uiOnly: "Comments cannot be deleted yet." },
  ),
  definePermission(
    "comments.delete_any",
    "Delete any comment",
    "Delete any comment.",
    "Comments",
    all,
    { uiOnly: "Comments cannot be deleted yet." },
  ),
];

// Chat belongs to the whole organization: channels are found and joined
// there, so its keys have no team or project scope.
export const chatPermissions: PermissionDefinition[] = [
  definePermission(
    "chat.view",
    "View chat",
    "Read public channels and the conversations the user is in.",
    "Chat",
    ["organization"],
  ),
  definePermission(
    "chat.post",
    "Send messages",
    "Post, reply and react in channels and direct messages.",
    "Chat",
    ["organization"],
  ),
  definePermission(
    "chat.channels.create",
    "Create channels",
    "Start new channels and direct messages.",
    "Chat",
    ["organization"],
  ),
  definePermission(
    "chat.files.upload",
    "Share files",
    "Attach files and images to messages.",
    "Chat",
    ["organization"],
  ),
  definePermission(
    "chat.channels.manage",
    "Manage any channel",
    "Rename, archive and change the members of any channel, not only ones the user runs.",
    "Chat",
    ["organization"],
  ),
];

export const filesPermissions: PermissionDefinition[] = [
  definePermission(
    "files.view",
    "View files",
    "Browse the organization's file library.",
    "Files",
    org,
  ),
  definePermission(
    "files.upload",
    "Upload files",
    "Add files to the library.",
    "Files",
    org,
  ),
  definePermission(
    "files.delete_own",
    "Delete own files",
    "Rename and delete files the user uploaded.",
    "Files",
    org,
  ),
  definePermission(
    "files.delete_any",
    "Delete any file",
    "Rename and delete any file in the library.",
    "Files",
    org,
  ),
];
