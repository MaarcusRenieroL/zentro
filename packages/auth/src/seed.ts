import { db as defaultDb } from "@zentro/db";
import { and, eq, inArray } from "@zentro/db/drizzle";
import {
  permissionOverrides,
  roleAssignments,
  roles,
  sessions,
  teamMembers,
  members,
} from "@zentro/db/schema";
import { getSystemRoleDefinitions } from "@zentro/permissions";

type Database = typeof defaultDb;

const systemRoleCount = getSystemRoleDefinitions().length;

/**
 * Creates the system roles of an organization when they are missing. Safe to
 * call concurrently: the unique indexes turn a lost race into a no-op.
 */
export async function ensureSystemRoles(
  database: Database,
  organizationId: string,
) {
  const existing = await database
    .select({ systemKey: roles.systemKey })
    .from(roles)
    .where(
      and(eq(roles.organizationId, organizationId), eq(roles.kind, "system")),
    );

  if (existing.length >= systemRoleCount) {
    return;
  }

  await database
    .insert(roles)
    .values(
      getSystemRoleDefinitions().map((definition) => ({
        organizationId,
        name: definition.name,
        description: definition.description,
        scope: definition.scope,
        kind: "system" as const,
        systemKey: definition.systemKey,
        permissions: definition.permissions,
        // Everything the role starts with counts as applied.
        appliedDefaults: definition.permissions,
      })),
    )
    .onConflictDoNothing();
}

/** Clears roles, overrides, team memberships and sessions tied to a removed member. */
export async function removeMemberAccess(
  database: Database,
  organizationId: string,
  userId: string,
) {
  const ownMembers = await database
    .select({ id: members.id })
    .from(members)
    .where(
      and(
        eq(members.organizationId, organizationId),
        eq(members.userId, userId),
      ),
    );

  await database
    .delete(roleAssignments)
    .where(
      and(
        eq(roleAssignments.organizationId, organizationId),
        eq(roleAssignments.principalType, "user"),
        eq(roleAssignments.principalId, userId),
      ),
    );
  await database
    .delete(permissionOverrides)
    .where(
      and(
        eq(permissionOverrides.organizationId, organizationId),
        eq(permissionOverrides.userId, userId),
      ),
    );

  if (ownMembers.length) {
    await database.delete(teamMembers).where(
      inArray(
        teamMembers.memberId,
        ownMembers.map((member) => member.id),
      ),
    );
  }

  await database
    .update(sessions)
    .set({ activeOrganizationId: null })
    .where(
      and(
        eq(sessions.userId, userId),
        eq(sessions.activeOrganizationId, organizationId),
      ),
    );
}
