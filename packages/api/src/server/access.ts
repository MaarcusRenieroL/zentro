import type { db as database } from "@zentro/db";
import {
  and,
  eq,
  inArray,
  isNull,
  or,
  sql,
  type SQL,
} from "@zentro/db/drizzle";
import {
  docs,
  permissionChangeLogs,
  roleAssignments,
  roles,
} from "@zentro/db/schema";

import { TRPCError } from "@trpc/server";
import { holdsAll, type ResourceContext } from "@zentro/permissions";

import type { PermissionContext } from "./permissions";

type Database = typeof database;

export async function logPermissionChange(
  db: Database,
  entry: {
    organizationId: string;
    actorUserId: string | null;
    action: string;
    targetType: string;
    targetId: string;
    before?: unknown;
    after?: unknown;
  },
) {
  await db.insert(permissionChangeLogs).values({
    organizationId: entry.organizationId,
    actorUserId: entry.actorUserId,
    action: entry.action,
    targetType: entry.targetType,
    targetId: entry.targetId,
    before: entry.before ?? null,
    after: entry.after ?? null,
  });
}

/**
 * Gives the creator of a project or team the matching lead role, so they can
 * manage what they just made.
 */
export async function assignCreatorLeadRole(
  db: Database,
  input: {
    organizationId: string;
    userId: string;
    systemKey: "project_lead" | "team_lead";
    scopeType: "project" | "team";
    scopeId: string;
  },
) {
  const [role] = await db
    .select({ id: roles.id })
    .from(roles)
    .where(
      and(
        eq(roles.organizationId, input.organizationId),
        eq(roles.systemKey, input.systemKey),
      ),
    )
    .limit(1);

  if (!role) {
    return;
  }

  const [assignment] = await db
    .insert(roleAssignments)
    .values({
      organizationId: input.organizationId,
      roleId: role.id,
      principalType: "user",
      principalId: input.userId,
      scopeType: input.scopeType,
      scopeId: input.scopeId,
      createdByUserId: input.userId,
    })
    .onConflictDoNothing()
    .returning();

  if (assignment) {
    await logPermissionChange(db, {
      organizationId: input.organizationId,
      actorUserId: input.userId,
      action: "assignment.created",
      targetType: input.scopeType,
      targetId: input.scopeId,
      after: { role: input.systemKey, userId: input.userId },
    });
  }
}

/**
 * SQL condition for the docs the caller may see with `key`: docs in projects
 * where they hold the permission, plus docs outside any project when they hold
 * it organization-wide (or, for team-scope roles, in that team).
 */
export async function visibleDocsCondition(
  permissions: PermissionContext,
  key: string,
): Promise<SQL> {
  const projectIds = await permissions.viewableProjectIds(key);
  const everywhere = await permissions.can(key);
  const conditions: SQL[] = [];

  if (everywhere) {
    conditions.push(isNull(docs.projectId));
  } else {
    // A role given on a team covers that team's docs outside any project.
    const teamIds = await permissions.teamIdsWith(key);

    if (teamIds.length) {
      conditions.push(
        and(isNull(docs.projectId), inArray(docs.teamId, teamIds))!,
      );
    }
  }

  if (projectIds.length) {
    conditions.push(inArray(docs.projectId, projectIds));
  }

  return or(...conditions) ?? sql`false`;
}

/**
 * Nobody may hand out more than they hold: the caller must hold every key
 * themselves in the scope the access is given in.
 */
export async function assertHoldsAll(
  permissions: PermissionContext,
  keys: readonly string[],
  resource: ResourceContext = {},
  message = "You cannot grant permissions you do not hold yourself.",
) {
  const snapshot = await permissions.snapshot();

  if (!holdsAll(snapshot, keys, resource)) {
    throw new TRPCError({ code: "FORBIDDEN", message });
  }
}
