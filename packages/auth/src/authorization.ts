import { admin, member, owner, statement } from "./permissions";

export type OrganizationRole = "owner" | "admin" | "member";

type PermissionRequest = {
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
  };
}
