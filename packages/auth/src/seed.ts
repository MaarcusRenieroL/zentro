import { db as defaultDb } from "@zentro/db";
import { and, eq, inArray, sql } from "@zentro/db/drizzle";
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

/** System roles whose default keys follow the code (Owner, Admin, Member). */
const defaultTrackedRoles = ["owner", "admin", "member"] as const;

/**
 * Creates the system roles of an organization when they are missing, and
 * hands existing Owner, Admin and Member roles the default keys that are new
 * since they last looked. Each role remembers the default keys it has already
 * been given (`appliedDefaults`), so a key an administrator removed stays
 * removed and only keys that are new in the defaults are added. Safe to call
 * concurrently: unique indexes turn a lost insert race into a no-op, and the
 * update only applies when the role is exactly as it was read.
 */
export async function ensureSystemRoles(
  database: Database,
  organizationId: string,
) {
  const readSystemRoles = () =>
    database
      .select({
        id: roles.id,
        systemKey: roles.systemKey,
        permissions: roles.permissions,
        appliedDefaults: roles.appliedDefaults,
      })
      .from(roles)
      .where(
        and(eq(roles.organizationId, organizationId), eq(roles.kind, "system")),
      );

  let existing = await readSystemRoles();

  if (existing.length < systemRoleCount) {
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
    existing = await readSystemRoles();
  }

  for (const definition of getSystemRoleDefinitions()) {
    if (!defaultTrackedRoles.some((key) => key === definition.systemKey)) {
      continue;
    }

    const row = existing.find(
      (item) => item.systemKey === definition.systemKey,
    );

    if (!row) {
      continue;
    }

    const fresh = definition.permissions.filter(
      (key) => !row.appliedDefaults.includes(key),
    );

    if (!fresh.length) {
      continue;
    }

    await database
      .update(roles)
      .set({
        permissions: Array.from(new Set([...row.permissions, ...fresh])),
        appliedDefaults: Array.from(
          new Set([...row.appliedDefaults, ...fresh]),
        ),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(roles.id, row.id),
          sql`${roles.appliedDefaults} = ${JSON.stringify(row.appliedDefaults)}::jsonb`,
          sql`${roles.permissions} = ${JSON.stringify(row.permissions)}::jsonb`,
        ),
      );
  }
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
