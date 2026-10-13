import {
  getSystemRoleDefinitions,
  type PermissionSnapshot,
  type SnapshotAssignment,
  type SnapshotOverride,
  type SnapshotRole,
} from "../src";

export const ORG = "00000000-0000-4000-8000-0000000000a1";
export const USER = "00000000-0000-4000-8000-0000000000b1";
export const OTHER_USER = "00000000-0000-4000-8000-0000000000b2";
export const TEAM = "00000000-0000-4000-8000-0000000000c1";
export const OTHER_TEAM = "00000000-0000-4000-8000-0000000000c2";
export const PROJECT = "00000000-0000-4000-8000-0000000000d1";
export const OTHER_PROJECT = "00000000-0000-4000-8000-0000000000d2";

export const systemRoles: SnapshotRole[] = getSystemRoleDefinitions().map(
  (definition) => ({
    id: `system-${definition.systemKey}`,
    name: definition.name,
    scope: definition.scope,
    systemKey: definition.systemKey,
    permissions: definition.permissions,
  }),
);

export function customRole(
  id: string,
  permissions: string[],
  scope: SnapshotRole["scope"] = "organization",
): SnapshotRole {
  return { id, name: id, scope, systemKey: null, permissions };
}

export function snapshot(
  overrides: Partial<PermissionSnapshot> & {
    extraRoles?: SnapshotRole[];
  } = {},
): PermissionSnapshot {
  const { extraRoles = [], ...rest } = overrides;

  return {
    organizationId: ORG,
    userId: USER,
    baseRole: "member",
    roles: [...systemRoles, ...extraRoles],
    assignments: [],
    teamIds: [],
    overrides: [],
    ...rest,
  };
}

export function assign(
  roleId: string,
  scopeType: SnapshotAssignment["scopeType"],
  scopeId: string,
  principalType: SnapshotAssignment["principalType"] = "user",
): SnapshotAssignment {
  return {
    roleId,
    principalType,
    principalId: principalType === "user" ? USER : TEAM,
    scopeType,
    scopeId,
  };
}

export function override(
  permission: string,
  effect: SnapshotOverride["effect"],
  scopeType: SnapshotOverride["scopeType"] = "organization",
  scopeId: string = ORG,
): SnapshotOverride {
  return { permission, effect, scopeType, scopeId };
}
