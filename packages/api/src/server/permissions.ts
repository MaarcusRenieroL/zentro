import { ensureSystemRoles } from "@zentro/auth";
import type { db as database } from "@zentro/db";
import { and, eq, isNull } from "@zentro/db/drizzle";
import {
  members,
  permissionOverrides,
  projects,
  roleAssignments,
  roles,
  teamMembers,
} from "@zentro/db/schema";
import {
  can as engineCan,
  check as engineCheck,
  reachablePermissions,
  type BaseRole,
  type Decision,
  type PermissionSnapshot,
  type ProjectAccessInfo,
  type ResourceContext,
} from "@zentro/permissions";

type Database = typeof database;

function toBaseRole(value: string | null | undefined): BaseRole | null {
  if (!value) {
    return null;
  }

  const parts = value.split(",").map((part) => part.trim());

  if (parts.includes("owner")) return "owner";
  if (parts.includes("admin")) return "admin";

  return "member";
}

/** Reads everything the engine needs about one user in one organization. */
export async function loadPermissionSnapshot(
  db: Database,
  organizationId: string,
  userId: string,
): Promise<PermissionSnapshot> {
  await ensureSystemRoles(db, organizationId);

  const [member] = await db
    .select({ id: members.id, role: members.role })
    .from(members)
    .where(
      and(
        eq(members.organizationId, organizationId),
        eq(members.userId, userId),
      ),
    )
    .limit(1);

  const teamRows = member
    ? await db
        .select({ teamId: teamMembers.teamId })
        .from(teamMembers)
        .where(eq(teamMembers.memberId, member.id))
    : [];
  const teamIds = teamRows.map((row) => row.teamId);

  const roleRows = await db
    .select()
    .from(roles)
    .where(eq(roles.organizationId, organizationId));

  const assignmentRows = await db
    .select()
    .from(roleAssignments)
    .where(eq(roleAssignments.organizationId, organizationId));

  const overrideRows = await db
    .select()
    .from(permissionOverrides)
    .where(
      and(
        eq(permissionOverrides.organizationId, organizationId),
        eq(permissionOverrides.userId, userId),
      ),
    );

  return {
    organizationId,
    userId,
    baseRole: toBaseRole(member?.role),
    roles: roleRows.map((role) => ({
      id: role.id,
      name: role.name,
      scope: role.scope,
      systemKey: role.systemKey,
      permissions: role.permissions,
    })),
    assignments: assignmentRows
      .filter(
        (assignment) =>
          (assignment.principalType === "user" &&
            assignment.principalId === userId) ||
          (assignment.principalType === "team" &&
            teamIds.includes(assignment.principalId)),
      )
      .map((assignment) => ({
        roleId: assignment.roleId,
        principalType: assignment.principalType,
        principalId: assignment.principalId,
        scopeType: assignment.scopeType,
        scopeId: assignment.scopeId,
      })),
    teamIds,
    overrides: overrideRows.map((override) => ({
      permission: override.permission,
      effect: override.effect,
      scopeType: override.scopeType,
      scopeId: override.scopeId,
      reason: override.reason,
    })),
  };
}

export type PermissionContext = {
  snapshot(): Promise<PermissionSnapshot>;
  check(key: string, resource?: ResourceContext): Promise<Decision>;
  can(key: string, resource?: ResourceContext): Promise<boolean>;
  /** Access info of every live project in the organization. */
  projects(): Promise<ProjectAccessInfo[]>;
  /** Ids of the projects where the caller holds `key` (and may see the project). */
  viewableProjectIds(key: string): Promise<string[]>;
  /** Ids of the teams where the caller holds `key` through a team-scope role. */
  teamIdsWith(key: string): Promise<string[]>;
  /** Whether `key` is held organization-wide, or in any project or team. */
  reachable(keys: readonly string[]): Promise<Record<string, boolean>>;
};

/** Loads the caller's snapshot once per request and answers checks from it. */
export function createPermissionContext(
  db: Database,
  organizationId: string | null,
  userId: string | null,
): PermissionContext {
  let snapshotPromise: Promise<PermissionSnapshot> | undefined;
  let projectsPromise: Promise<ProjectAccessInfo[]> | undefined;

  const snapshot = () => {
    if (!organizationId || !userId) {
      return Promise.reject(new Error("No organization or user in context."));
    }

    snapshotPromise ??= loadPermissionSnapshot(db, organizationId, userId);

    return snapshotPromise;
  };

  const projectList = () => {
    if (!organizationId) {
      return Promise.resolve([]);
    }

    projectsPromise ??= db
      .select({
        id: projects.id,
        teamId: projects.teamId,
        visibility: projects.visibility,
      })
      .from(projects)
      .where(
        and(
          eq(projects.organizationId, organizationId),
          isNull(projects.deletedAt),
        ),
      );

    return projectsPromise;
  };

  return {
    snapshot,
    projects: projectList,
    async check(key, resource) {
      return engineCheck(await snapshot(), key, resource);
    },
    async can(key, resource) {
      return engineCan(await snapshot(), key, resource);
    },
    async viewableProjectIds(key) {
      const current = await snapshot();

      return (await projectList())
        .filter((project) => engineCan(current, key, { project }))
        .map((project) => project.id);
    },
    async teamIdsWith(key) {
      const current = await snapshot();
      const teamIds = new Set(
        current.assignments
          .filter((assignment) => assignment.scopeType === "team")
          .map((assignment) => assignment.scopeId),
      );

      return [...teamIds].filter((teamId) =>
        engineCan(current, key, { teamId }),
      );
    },
    async reachable(keys) {
      return reachablePermissions(await snapshot(), await projectList(), keys);
    },
  };
}
