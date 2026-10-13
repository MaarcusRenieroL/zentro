import type { db as database } from "@zentro/db";
import {
  and,
  eq,
  gt,
  inArray,
  isNull,
  or,
  sql,
  type SQL,
} from "@zentro/db/drizzle";
import {
  activityEvents,
  docs,
  roleAssignments,
  roles,
} from "@zentro/db/schema";

import { TRPCError } from "@trpc/server";
import { holdsAll, type ResourceContext } from "@zentro/permissions";

import type { AuditContext } from "./audit";
import type { PermissionContext } from "./permissions";

type Database = typeof database;

/** A database or transaction handle. */
export type DbHandle = Pick<
  Database,
  "select" | "insert" | "update" | "delete"
>;

/**
 * Gives the creator of a project or team the matching lead role, so they can
 * manage what they just made.
 */
export async function assignCreatorLeadRole(
  tx: DbHandle,
  audit: AuditContext,
  input: {
    organizationId: string;
    userId: string;
    systemKey: "project_lead" | "team_lead";
    scopeType: "project" | "team";
    scopeId: string;
    scopeName: string;
  },
) {
  const [role] = await tx
    .select({ id: roles.id, name: roles.name })
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

  const [assignment] = await tx
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
    await audit.record(tx, {
      action: "assignment.created",
      target: {
        id: assignment.id,
        label: `${role.name} on ${input.scopeName}`,
      },
      projectId: input.scopeType === "project" ? input.scopeId : null,
      teamId: input.scopeType === "team" ? input.scopeId : null,
      metadata: {
        roleId: role.id,
        roleName: role.name,
        principalType: "user",
        principalId: input.userId,
        scopeType: input.scopeType,
        scopeId: input.scopeId,
        creator: true,
      },
    });
  }
}

/** Longest gap between two recorded edits of the same doc by the same person. */
export const docEditDebounceMs = 10 * 60 * 1000;

/**
 * Whether the person already has a `doc.updated` event for the doc inside the
 * debounce window. The store is append-only, so a later edit inside the window
 * is simply not recorded and the first event stands.
 */
export async function hasRecentDocEdit(
  tx: DbHandle,
  input: { organizationId: string; docId: string; userId: string },
) {
  const since = new Date(Date.now() - docEditDebounceMs);
  const [recent] = await tx
    .select({ id: activityEvents.id })
    .from(activityEvents)
    .where(
      and(
        eq(activityEvents.organizationId, input.organizationId),
        eq(activityEvents.action, "doc.updated"),
        eq(activityEvents.targetId, input.docId),
        eq(activityEvents.actorUserId, input.userId),
        gt(activityEvents.createdAt, since),
      ),
    )
    .limit(1);

  return Boolean(recent);
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
