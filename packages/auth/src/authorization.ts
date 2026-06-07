import { admin, member, owner, statement } from "./permissions";

export type OrganizationRole = "owner" | "admin" | "member";

export type PermissionRequest = {
  [Resource in keyof typeof statement]?: (typeof statement)[Resource][number][];
};

export function hasOrganizationPermission(
  role: OrganizationRole,
  permission: PermissionRequest,
) {
  if (role === "owner") {
    return owner.authorize(permission).success;
  }

  if (role === "admin") {
    return admin.authorize(permission).success;
  }

  return member.authorize(permission).success;
}

export function getOrganizationPermissions(role: OrganizationRole) {
  return {
    canUpdateOrganization: hasOrganizationPermission(role, {
      organization: ["update"],
    }),
    canDeleteOrganization: hasOrganizationPermission(role, {
      organization: ["delete"],
    }),
    canInviteMembers: hasOrganizationPermission(role, {
      members: ["invite"],
    }),
    canRemoveMembers: hasOrganizationPermission(role, {
      members: ["remove"],
    }),
    canUpdateMemberRoles: hasOrganizationPermission(role, {
      members: ["update-role"],
    }),
    canManageBilling: hasOrganizationPermission(role, {
      billing: ["manage"],
    }),
    canCreateProjects: hasOrganizationPermission(role, {
      project: ["create"],
    }),
    canUpdateProjects: hasOrganizationPermission(role, {
      project: ["update"],
    }),
    canArchiveProjects: hasOrganizationPermission(role, {
      project: ["archive"],
    }),
    canDeleteProjects: hasOrganizationPermission(role, {
      project: ["delete"],
    }),
    canCreateDocs: hasOrganizationPermission(role, {
      doc: ["create"],
    }),
    canUpdateDocs: hasOrganizationPermission(role, {
      doc: ["update"],
    }),
    canDeleteDocs: hasOrganizationPermission(role, {
      doc: ["delete"],
    }),
    canRestoreDocs: hasOrganizationPermission(role, {
      doc: ["restore"],
    }),
    canCommentOnDocs: hasOrganizationPermission(role, {
      doc: ["comment"],
    }),
    canCreateTeams: hasOrganizationPermission(role, {
      team: ["create"],
    }),
    canUpdateTeams: hasOrganizationPermission(role, {
      team: ["update"],
    }),
    canDeleteTeams: hasOrganizationPermission(role, {
      team: ["delete"],
    }),
    canManageTeamMembers: hasOrganizationPermission(role, {
      team: ["manage-members"],
    }),
  };
}
