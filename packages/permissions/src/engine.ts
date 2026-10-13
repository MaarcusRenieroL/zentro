import type { PermissionScope } from "@zentro/modules";

import { getAnyKey, getPermission } from "./catalog";

export type BaseRole = "owner" | "admin" | "member";
export type ProjectVisibility = "organization" | "team" | "private";

export type SnapshotRole = {
  id: string;
  name: string;
  scope: PermissionScope;
  systemKey: string | null;
  permissions: string[];
};

export type SnapshotAssignment = {
  roleId: string;
  principalType: "user" | "team";
  principalId: string;
  scopeType: PermissionScope;
  scopeId: string;
};

export type SnapshotOverride = {
  permission: string;
  effect: "allow" | "deny";
  scopeType: PermissionScope;
  scopeId: string;
  reason?: string | null;
};

/** Everything the engine knows about one user in one organization. */
export type PermissionSnapshot = {
  organizationId: string;
  userId: string;
  /** Null when the user is not a member of the organization. */
  baseRole: BaseRole | null;
  /** Every role of the organization. */
  roles: SnapshotRole[];
  /** Assignments to the user and to teams the user belongs to. */
  assignments: SnapshotAssignment[];
  /** Teams the user belongs to. */
  teamIds: string[];
  overrides: SnapshotOverride[];
};

export type ProjectAccessInfo = {
  id: string;
  teamId: string | null;
  visibility: ProjectVisibility;
};

export type ResourceContext = {
  teamId?: string | null;
  projectId?: string | null;
  /** The user that owns the resource, for `_own` permissions. */
  ownerUserId?: string | null;
  /** Set for projects and for things inside a project. */
  project?: ProjectAccessInfo | null;
};

export type ReasonKind =
  | "owner"
  | "owner_only"
  | "role"
  | "assignment"
  | "override"
  | "visibility"
  | "own"
  | "unknown"
  | "none";

export type Reason = {
  kind: ReasonKind;
  message: string;
  roleName?: string;
};

export type Decision = {
  allowed: boolean;
  reasons: Reason[];
};

type Scoped = { scopeType: PermissionScope; scopeId: string };

function resolveContext(resource: ResourceContext) {
  return {
    teamId: resource.teamId ?? resource.project?.teamId ?? null,
    projectId: resource.projectId ?? resource.project?.id ?? null,
  };
}

function appliesTo(
  snapshot: PermissionSnapshot,
  scoped: Scoped,
  resource: ResourceContext,
) {
  const { teamId, projectId } = resolveContext(resource);

  if (scoped.scopeType === "organization") {
    return scoped.scopeId === snapshot.organizationId;
  }

  if (scoped.scopeType === "team") {
    return teamId !== null && scoped.scopeId === teamId;
  }

  return projectId !== null && scoped.scopeId === projectId;
}

type KeyState = {
  has: boolean;
  denied: boolean;
  reasons: Reason[];
};

function evaluateKey(
  snapshot: PermissionSnapshot,
  key: string,
  resource: ResourceContext,
): KeyState {
  const reasons: Reason[] = [];
  const definition = getPermission(key);

  const denies = snapshot.overrides.filter(
    (override) =>
      override.permission === key &&
      override.effect === "deny" &&
      appliesTo(snapshot, override, resource),
  );

  if (denies.length) {
    return {
      has: false,
      denied: true,
      reasons: denies.map((override) => ({
        kind: "override",
        message: `Denied by an override${override.reason ? `: ${override.reason}` : ""}.`,
      })),
    };
  }

  let has = false;

  // The system role for the base organization role.
  if (snapshot.baseRole && snapshot.baseRole !== "owner") {
    const base = snapshot.roles.find(
      (role) => role.systemKey === snapshot.baseRole,
    );

    if (base?.permissions.includes(key)) {
      has = true;
      reasons.push({
        kind: "role",
        message: `Granted by the ${base.name} role.`,
        roleName: base.name,
      });
    }
  }

  // Roles assigned at the organization, to the resource's team or project.
  for (const assignment of snapshot.assignments) {
    if (!appliesTo(snapshot, assignment, resource)) {
      continue;
    }

    if (definition && !definition.scopes.includes(assignment.scopeType)) {
      continue;
    }

    const role = snapshot.roles.find((item) => item.id === assignment.roleId);

    if (role?.permissions.includes(key)) {
      has = true;
      reasons.push({
        kind: "assignment",
        message: `Granted by the ${role.name} role assigned at ${assignment.scopeType} level.`,
        roleName: role.name,
      });
    }
  }

  const allows = snapshot.overrides.filter(
    (override) =>
      override.permission === key &&
      override.effect === "allow" &&
      appliesTo(snapshot, override, resource),
  );

  for (const override of allows) {
    has = true;
    reasons.push({
      kind: "override",
      message: `Allowed by an override${override.reason ? `: ${override.reason}` : ""}.`,
    });
  }

  return { has, denied: false, reasons };
}

function hasProjectAssignment(snapshot: PermissionSnapshot, projectId: string) {
  return snapshot.assignments.some(
    (assignment) =>
      assignment.scopeType === "project" && assignment.scopeId === projectId,
  );
}

/** Whether the user may see a project (and therefore what is inside it). */
export function checkProjectVisibility(
  snapshot: PermissionSnapshot,
  project: ProjectAccessInfo,
): Decision {
  if (snapshot.baseRole === "owner") {
    return {
      allowed: true,
      reasons: [{ kind: "owner", message: "Owners can see everything." }],
    };
  }

  if (!snapshot.baseRole && !hasProjectAssignment(snapshot, project.id)) {
    return {
      allowed: false,
      reasons: [
        { kind: "none", message: "Not a member of this organization." },
      ],
    };
  }

  const resource: ResourceContext = { project };
  const basic = evaluateKey(snapshot, "projects.view", resource);

  if (basic.denied) {
    return { allowed: false, reasons: basic.reasons };
  }

  const viewPrivate = evaluateKey(snapshot, "projects.view_private", resource);

  if (viewPrivate.denied) {
    // A deny on view_private only removes that extra access.
    viewPrivate.has = false;
  }

  const assigned = hasProjectAssignment(snapshot, project.id);
  const reasons: Reason[] = [];

  if (viewPrivate.has) {
    return {
      allowed: true,
      reasons: [
        {
          kind: "visibility",
          message: "Can view private and team projects.",
        },
        ...viewPrivate.reasons,
      ],
    };
  }

  if (assigned) {
    return {
      allowed: true,
      reasons: [{ kind: "visibility", message: "Has a role on this project." }],
    };
  }

  if (project.visibility === "organization") {
    if (basic.has) {
      return { allowed: true, reasons: basic.reasons };
    }

    reasons.push({ kind: "none", message: "Cannot view projects." });
  } else if (project.visibility === "team") {
    const inTeam =
      project.teamId !== null && snapshot.teamIds.includes(project.teamId);

    if (inTeam && basic.has) {
      return {
        allowed: true,
        reasons: [
          { kind: "visibility", message: "Member of the project's team." },
        ],
      };
    }

    reasons.push({
      kind: "visibility",
      message: "The project is visible to its team only.",
    });
  } else {
    reasons.push({
      kind: "visibility",
      message: "The project is private.",
    });
  }

  return { allowed: false, reasons };
}

/** Checks one permission, with ownership and project visibility applied. */
export function check(
  snapshot: PermissionSnapshot,
  key: string,
  resource: ResourceContext = {},
): Decision {
  const definition = getPermission(key);

  if (!definition) {
    return {
      allowed: false,
      reasons: [{ kind: "unknown", message: `Unknown permission ${key}.` }],
    };
  }

  if (snapshot.baseRole === "owner") {
    return {
      allowed: true,
      reasons: [{ kind: "owner", message: "Owners can do everything." }],
    };
  }

  if (definition.ownerOnly) {
    return {
      allowed: false,
      reasons: [
        {
          kind: "owner_only",
          message: "Only the organization owner can do this.",
        },
      ],
    };
  }

  if (!snapshot.baseRole && !snapshot.assignments.length) {
    return {
      allowed: false,
      reasons: [
        { kind: "none", message: "Not a member of this organization." },
      ],
    };
  }

  // Everything inside a project needs access to the project first.
  if (resource.project) {
    const visibility = checkProjectVisibility(snapshot, resource.project);

    if (!visibility.allowed) {
      return visibility;
    }

    if (key === "projects.view") {
      return visibility;
    }
  }

  const anyKey = getAnyKey(key);

  if (anyKey) {
    const own = evaluateKey(snapshot, key, resource);
    const any = evaluateKey(snapshot, anyKey, resource);

    if (own.denied || any.denied) {
      return { allowed: false, reasons: [...own.reasons, ...any.reasons] };
    }

    if (any.has) {
      return { allowed: true, reasons: any.reasons };
    }

    if (own.has) {
      if (resource.ownerUserId && resource.ownerUserId === snapshot.userId) {
        return {
          allowed: true,
          reasons: [
            { kind: "own", message: "The user owns this item." },
            ...own.reasons,
          ],
        };
      }

      return {
        allowed: false,
        reasons: [
          {
            kind: "own",
            message: "Only allowed on items the user owns.",
          },
        ],
      };
    }

    return {
      allowed: false,
      reasons: [{ kind: "none", message: `No role grants ${key}.` }],
    };
  }

  const state = evaluateKey(snapshot, key, resource);

  if (state.has) {
    return { allowed: true, reasons: state.reasons };
  }

  return {
    allowed: false,
    reasons: state.denied
      ? state.reasons
      : [{ kind: "none", message: `No role grants ${key}.` }],
  };
}

export function can(
  snapshot: PermissionSnapshot,
  key: string,
  resource: ResourceContext = {},
) {
  return check(snapshot, key, resource).allowed;
}

/** True when the user holds every key at the given scope. */
export function holdsAll(
  snapshot: PermissionSnapshot,
  keys: readonly string[],
  resource: ResourceContext = {},
) {
  return keys.every((key) => can(snapshot, key, resource));
}

/** Organization-level decision for each key, for gating the UI. */
export function effectivePermissions(
  snapshot: PermissionSnapshot,
  keys: readonly string[],
  resource: ResourceContext = {},
) {
  return Object.fromEntries(
    keys.map((key) => [key, can(snapshot, key, resource)]),
  );
}

/** Keys the engine itself applies inside every project-scoped check. */
export const engineEnforcedKeys = ["projects.view_private"] as const;
