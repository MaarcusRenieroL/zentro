import { TRPCError } from "@trpc/server";
import {
  and,
  asc,
  count,
  desc,
  eq,
  inArray,
  like,
  or,
} from "@zentro/db/drizzle";
import {
  activityEvents,
  members,
  permissionOverrides,
  projects,
  roleAssignments,
  roles,
  teamMembers,
  teams,
  users,
} from "@zentro/db/schema";
import {
  getCatalog,
  getPermission,
  getSystemRoleDefinition,
  check as engineCheck,
  type PermissionSnapshot,
  type ResourceContext,
} from "@zentro/permissions";
import { z } from "zod";

import { buildChanges } from "@zentro/audit";

import { cursorCondition, cursorSchema, encodeCursor } from "../activity";
import { assertHoldsAll } from "../access";
import { loadEnabledModules } from "../modules";
import { loadPermissionSnapshot } from "../permissions";
import { loadProjectById } from "../resources";
import {
  assertAnyPermission,
  protectedProcedure,
  permissionProcedure,
  router,
  type OrganizationContext,
} from "../trpc";

const scopeSchema = z.enum(["organization", "team", "project"]);
const uuid = z.string().uuid();

function conflict(message: string) {
  return new TRPCError({ code: "CONFLICT", message });
}

function notFound(message: string) {
  return new TRPCError({ code: "NOT_FOUND", message });
}

function forbidden(message: string) {
  return new TRPCError({ code: "FORBIDDEN", message });
}

/** Rejects unknown keys, owner-only keys and keys the scope cannot hold. */
function validatePermissionKeys(
  scope: z.infer<typeof scopeSchema>,
  keys: readonly string[],
) {
  for (const key of keys) {
    const definition = getPermission(key);

    if (!definition) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Unknown permission ${key}.`,
      });
    }

    if (definition.ownerOnly) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `${definition.label} is reserved for the owner and cannot be granted.`,
      });
    }

    if (!definition.scopes.includes(scope)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `${definition.label} cannot be granted at ${scope} level.`,
      });
    }
  }

  return Array.from(new Set(keys));
}

async function loadRole(ctx: OrganizationContext, id: string) {
  const [role] = await ctx.db
    .select()
    .from(roles)
    .where(
      and(
        eq(roles.id, id),
        eq(roles.organizationId, ctx.activeOrganization.id),
      ),
    )
    .limit(1);

  if (!role) {
    throw notFound("Role not found.");
  }

  return role;
}

async function assignmentCount(ctx: OrganizationContext, roleId: string) {
  const [row] = await ctx.db
    .select({ count: count() })
    .from(roleAssignments)
    .where(eq(roleAssignments.roleId, roleId));

  return row?.count ?? 0;
}

/** The resource a scope refers to, checked to belong to the organization. */
async function resolveScope(
  ctx: OrganizationContext,
  scopeType: z.infer<typeof scopeSchema>,
  scopeId: string,
): Promise<ResourceContext> {
  const organizationId = ctx.activeOrganization.id;

  if (scopeType === "organization") {
    if (scopeId !== organizationId) {
      throw notFound("Scope not found.");
    }

    return {};
  }

  if (scopeType === "team") {
    const [team] = await ctx.db
      .select({ id: teams.id })
      .from(teams)
      .where(
        and(eq(teams.id, scopeId), eq(teams.organizationId, organizationId)),
      )
      .limit(1);

    if (!team) {
      throw notFound("Team not found.");
    }

    return { teamId: team.id };
  }

  const project = await loadProjectById(ctx, scopeId);

  if (!project) {
    throw notFound("Project not found.");
  }

  return { project };
}

const assignKeys: Record<z.infer<typeof scopeSchema>, string[]> = {
  organization: ["roles.assign"],
  team: ["roles.assign", "teams.members.manage"],
  project: ["roles.assign", "projects.members.manage"],
};

/** Names for an assignment's scope and principal, kept with the event. */
async function describeAssignment(
  ctx: OrganizationContext,
  assignment: {
    scopeType: z.infer<typeof scopeSchema>;
    scopeId: string;
    principalType: "user" | "team";
    principalId: string;
  },
) {
  let scopeName = ctx.activeOrganization.name;

  if (assignment.scopeType === "team") {
    const [row] = await ctx.db
      .select({ name: teams.name })
      .from(teams)
      .where(eq(teams.id, assignment.scopeId))
      .limit(1);

    scopeName = row?.name ?? "a team";
  } else if (assignment.scopeType === "project") {
    const [row] = await ctx.db
      .select({ name: projects.name })
      .from(projects)
      .where(eq(projects.id, assignment.scopeId))
      .limit(1);

    scopeName = row?.name ?? "a project";
  }

  let principalName: string | null = null;

  if (assignment.principalType === "user") {
    const [row] = await ctx.db
      .select({ name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, assignment.principalId))
      .limit(1);

    principalName = row ? row.name || row.email : null;
  } else {
    const [row] = await ctx.db
      .select({ name: teams.name })
      .from(teams)
      .where(eq(teams.id, assignment.principalId))
      .limit(1);

    principalName = row?.name ?? null;
  }

  return { scopeName, principalName };
}

async function loadMemberOfOrganization(
  ctx: OrganizationContext,
  userId: string,
) {
  const [member] = await ctx.db
    .select({ id: members.id, userId: members.userId, role: members.role })
    .from(members)
    .where(
      and(
        eq(members.userId, userId),
        eq(members.organizationId, ctx.activeOrganization.id),
      ),
    )
    .limit(1);

  return member;
}

const isOwnerRole = (role: string) =>
  role
    .split(",")
    .map((part) => part.trim())
    .includes("owner");

const baseRank = { owner: 3, admin: 2, member: 1 } as const;

function rankOf(role: string | null | undefined) {
  const parts = (role ?? "").split(",").map((part) => part.trim());

  if (parts.includes("owner")) return baseRank.owner;
  if (parts.includes("admin")) return baseRank.admin;
  if (parts.includes("member")) return baseRank.member;

  return 0;
}

/**
 * Self-service and rank protection shared by assignments and overrides: you
 * cannot change your own access, an owner's access, or the access of someone
 * who outranks you (an admin, when you are not one).
 */
async function assertMayModifyUser(ctx: OrganizationContext, userId: string) {
  if (userId === ctx.user.id) {
    throw forbidden("You cannot change your own roles or overrides.");
  }

  const target = await loadMemberOfOrganization(ctx, userId);

  if (!target) {
    throw notFound("That person is not a member of this organization.");
  }

  if (isOwnerRole(target.role)) {
    throw forbidden("An owner's access cannot be changed.");
  }

  const caller = await ctx.permissions.snapshot();

  if (rankOf(target.role) > rankOf(caller.baseRole)) {
    throw forbidden(
      "You cannot change the access of someone with a higher role than yours.",
    );
  }
}

/**
 * A team lead (who holds team-level management but not organization-wide role
 * assignment) works within their own team only.
 */
async function assertTeamLeadBounds(
  ctx: OrganizationContext,
  teamId: string,
  principal: { type: "user" | "team"; id: string },
) {
  if (await ctx.permissions.can("roles.assign")) {
    return;
  }

  if (principal.type === "team") {
    if (principal.id !== teamId) {
      throw forbidden("You can only give roles to your own team.");
    }

    return;
  }

  const [membership] = await ctx.db
    .select({ id: teamMembers.id })
    .from(teamMembers)
    .innerJoin(members, eq(members.id, teamMembers.memberId))
    .where(
      and(eq(teamMembers.teamId, teamId), eq(members.userId, principal.id)),
    )
    .limit(1);

  if (!membership) {
    throw forbidden("That person is not a member of this team.");
  }
}

const roleInput = {
  name: z.string().trim().min(2).max(60),
  description: z.string().trim().max(300).optional(),
};

function summarizeRole(role: typeof roles.$inferSelect) {
  return {
    id: role.id,
    name: role.name,
    scope: role.scope,
    kind: role.kind,
    systemKey: role.systemKey,
    permissions: role.permissions,
  };
}

const rolesRouter = router({
  list: permissionProcedure("roles.view").query(async ({ ctx }) => {
    const rows = await ctx.db
      .select()
      .from(roles)
      .where(eq(roles.organizationId, ctx.activeOrganization.id))
      .orderBy(asc(roles.scope), asc(roles.kind), asc(roles.name));
    const counts = await ctx.db
      .select({ roleId: roleAssignments.roleId, count: count() })
      .from(roleAssignments)
      .where(eq(roleAssignments.organizationId, ctx.activeOrganization.id))
      .groupBy(roleAssignments.roleId);

    return rows.map((role) => ({
      ...role,
      assignmentCount: counts.find((row) => row.roleId === role.id)?.count ?? 0,
      editable:
        role.kind === "custom" ||
        role.systemKey === "admin" ||
        role.systemKey === "member",
    }));
  }),

  get: permissionProcedure("roles.view")
    .input(z.object({ id: uuid }))
    .query(async ({ ctx, input }) => loadRole(ctx, input.id)),

  create: permissionProcedure("roles.create", undefined, {
    audit: ["role.created"],
  })
    .input(
      z.object({
        ...roleInput,
        scope: scopeSchema,
        permissions: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const keys = validatePermissionKeys(input.scope, input.permissions);

      await assertHoldsAll(ctx.permissions, keys);

      const role = await ctx.db.transaction(async (tx) => {
        const [created] = await tx
          .insert(roles)
          .values({
            organizationId: ctx.activeOrganization.id,
            name: input.name,
            description: input.description ?? null,
            scope: input.scope,
            kind: "custom",
            permissions: keys,
            createdByUserId: ctx.user.id,
          })
          .onConflictDoNothing()
          .returning();

        if (!created) {
          throw conflict("A role with this name already exists.");
        }

        await ctx.audit.record(tx, {
          action: "role.created",
          target: { id: created.id, label: created.name },
          metadata: { after: summarizeRole(created) },
        });

        return created;
      });

      return role;
    }),

  update: permissionProcedure("roles.update", undefined, {
    audit: ["role.updated"],
  })
    .input(
      z.object({
        id: uuid,
        name: roleInput.name.optional(),
        description: roleInput.description,
        permissions: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const role = await loadRole(ctx, input.id);
      const isBaseSystemRole =
        role.systemKey === "admin" || role.systemKey === "member";

      if (role.systemKey === "owner") {
        throw forbidden("The Owner role cannot be changed.");
      }

      if (role.kind === "system" && !isBaseSystemRole) {
        throw forbidden("This system role cannot be changed.");
      }

      if (isBaseSystemRole && input.name && input.name !== role.name) {
        throw forbidden("System roles cannot be renamed.");
      }

      const nextPermissions = input.permissions
        ? validatePermissionKeys(role.scope, input.permissions)
        : role.permissions;

      // Editing a role means being able to hand out all of it.
      await assertHoldsAll(
        ctx.permissions,
        [...role.permissions, ...nextPermissions],
        {},
        "You cannot edit a role that grants permissions you do not hold.",
      );

      const updated = await ctx.db.transaction(async (tx) => {
        const [row] = await tx
          .update(roles)
          .set({
            ...(input.name ? { name: input.name } : {}),
            ...(input.description !== undefined
              ? { description: input.description }
              : {}),
            permissions: nextPermissions,
            updatedAt: new Date(),
          })
          .where(eq(roles.id, role.id))
          .returning()
          .catch(() => {
            throw conflict("A role with this name already exists.");
          });

        await ctx.audit.record(tx, {
          action: "role.updated",
          target: { id: role.id, label: row!.name },
          changes: buildChanges(
            { name: role.name, description: role.description },
            { name: row!.name, description: row!.description },
          ),
          metadata: {
            before: summarizeRole(role),
            after: summarizeRole(row!),
            addedPermissions: nextPermissions.filter(
              (key) => !role.permissions.includes(key),
            ),
            removedPermissions: role.permissions.filter(
              (key) => !nextPermissions.includes(key),
            ),
          },
        });

        return row!;
      });

      return updated;
    }),

  delete: permissionProcedure("roles.delete", undefined, {
    audit: ["role.deleted"],
  })
    .input(z.object({ id: uuid }))
    .mutation(async ({ ctx, input }) => {
      const role = await loadRole(ctx, input.id);

      if (role.kind === "system") {
        throw forbidden("System roles cannot be deleted.");
      }

      const assigned = await assignmentCount(ctx, role.id);

      if (assigned > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `This role is assigned ${assigned} time${assigned === 1 ? "" : "s"}. Reassign or remove those assignments first.`,
        });
      }

      await ctx.db.transaction(async (tx) => {
        await tx.delete(roles).where(eq(roles.id, role.id));
        await ctx.audit.record(tx, {
          action: "role.deleted",
          target: { id: role.id, label: role.name },
          metadata: { before: summarizeRole(role) },
        });
      });

      return { id: role.id };
    }),

  clone: permissionProcedure("roles.create", undefined, {
    audit: ["role.cloned"],
  })
    .input(z.object({ id: uuid, name: roleInput.name }))
    .mutation(async ({ ctx, input }) => {
      const source = await loadRole(ctx, input.id);
      // Owner-only keys never travel into a custom role.
      const keys = source.permissions.filter(
        (key) => !getPermission(key)?.ownerOnly,
      );

      await assertHoldsAll(ctx.permissions, keys);

      const role = await ctx.db.transaction(async (tx) => {
        const [created] = await tx
          .insert(roles)
          .values({
            organizationId: ctx.activeOrganization.id,
            name: input.name,
            description: source.description,
            scope: source.scope,
            kind: "custom",
            permissions: keys,
            createdByUserId: ctx.user.id,
          })
          .onConflictDoNothing()
          .returning();

        if (!created) {
          throw conflict("A role with this name already exists.");
        }

        await ctx.audit.record(tx, {
          action: "role.cloned",
          target: { id: created.id, label: created.name },
          metadata: {
            clonedFrom: source.id,
            clonedFromName: source.name,
            after: summarizeRole(created),
          },
        });

        return created;
      });

      return role;
    }),

  resetSystem: permissionProcedure("roles.update", undefined, {
    audit: ["role.reset"],
  })
    .input(z.object({ systemKey: z.enum(["admin", "member"]) }))
    .mutation(async ({ ctx, input }) => {
      const definition = getSystemRoleDefinition(input.systemKey)!;
      const [role] = await ctx.db
        .select()
        .from(roles)
        .where(
          and(
            eq(roles.organizationId, ctx.activeOrganization.id),
            eq(roles.systemKey, input.systemKey),
          ),
        )
        .limit(1);

      if (!role) {
        throw notFound("Role not found.");
      }

      await assertHoldsAll(
        ctx.permissions,
        [...role.permissions, ...definition.permissions],
        {},
        "You cannot reset a role that grants permissions you do not hold.",
      );

      const updated = await ctx.db.transaction(async (tx) => {
        const [row] = await tx
          .update(roles)
          .set({
            permissions: definition.permissions,
            // The defaults as they are now count as applied.
            appliedDefaults: definition.permissions,
            updatedAt: new Date(),
          })
          .where(eq(roles.id, role.id))
          .returning();

        await ctx.audit.record(tx, {
          action: "role.reset",
          target: { id: role.id, label: role.name },
          metadata: {
            before: summarizeRole(role),
            after: summarizeRole(row!),
          },
        });

        return row!;
      });

      return updated;
    }),
});

const assignmentsRouter = router({
  list: permissionProcedure("roles.view")
    .input(
      z
        .object({
          userId: uuid.optional(),
          roleId: uuid.optional(),
          scopeType: scopeSchema.optional(),
          scopeId: uuid.optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const organizationId = ctx.activeOrganization.id;
      const conditions = [eq(roleAssignments.organizationId, organizationId)];

      if (input?.userId) {
        conditions.push(
          eq(roleAssignments.principalType, "user"),
          eq(roleAssignments.principalId, input.userId),
        );
      }

      if (input?.roleId)
        conditions.push(eq(roleAssignments.roleId, input.roleId));
      if (input?.scopeType)
        conditions.push(eq(roleAssignments.scopeType, input.scopeType));
      if (input?.scopeId)
        conditions.push(eq(roleAssignments.scopeId, input.scopeId));

      const allRows = await ctx.db
        .select({
          id: roleAssignments.id,
          roleId: roleAssignments.roleId,
          roleName: roles.name,
          principalType: roleAssignments.principalType,
          principalId: roleAssignments.principalId,
          scopeType: roleAssignments.scopeType,
          scopeId: roleAssignments.scopeId,
          createdAt: roleAssignments.createdAt,
        })
        .from(roleAssignments)
        .innerJoin(roles, eq(roles.id, roleAssignments.roleId))
        .where(and(...conditions))
        .orderBy(desc(roleAssignments.createdAt));
      // Projects the caller cannot see (private, or another team's) stay out,
      // names included.
      const visibleProjects = new Set(
        await ctx.permissions.viewableProjectIds("projects.view"),
      );
      const rows = allRows.filter(
        (row) =>
          row.scopeType !== "project" || visibleProjects.has(row.scopeId),
      );

      const userIds = rows
        .filter((row) => row.principalType === "user")
        .map((row) => row.principalId);
      const teamIds = [
        ...rows
          .filter((row) => row.principalType === "team")
          .map((row) => row.principalId),
        ...rows
          .filter((row) => row.scopeType === "team")
          .map((row) => row.scopeId),
      ];
      const projectIds = rows
        .filter((row) => row.scopeType === "project")
        .map((row) => row.scopeId);

      const [userRows, teamRows, projectRows] = await Promise.all([
        userIds.length
          ? ctx.db
              .select({ id: users.id, name: users.name, email: users.email })
              .from(users)
              .where(inArray(users.id, userIds))
          : [],
        teamIds.length
          ? ctx.db
              .select({ id: teams.id, name: teams.name })
              .from(teams)
              .where(inArray(teams.id, teamIds))
          : [],
        projectIds.length
          ? ctx.db
              .select({ id: projects.id, name: projects.name })
              .from(projects)
              .where(inArray(projects.id, projectIds))
          : [],
      ]);

      return rows.map((row) => ({
        ...row,
        principalName:
          row.principalType === "user"
            ? (userRows.find((user) => user.id === row.principalId)?.name ??
              userRows.find((user) => user.id === row.principalId)?.email ??
              "Unknown user")
            : (teamRows.find((team) => team.id === row.principalId)?.name ??
              "Unknown team"),
        scopeName:
          row.scopeType === "organization"
            ? ctx.activeOrganization.name
            : row.scopeType === "team"
              ? (teamRows.find((team) => team.id === row.scopeId)?.name ??
                "Unknown team")
              : (projectRows.find((project) => project.id === row.scopeId)
                  ?.name ?? "Unknown project"),
      }));
    }),

  // For the team roles panel. A team lead has no organization-wide
  // roles.view, so this answers from team-level management instead.
  listForTeam: protectedProcedure
    .meta({ permissions: ["roles.view", "teams.members.manage"] })
    .input(z.object({ teamId: uuid }))
    .query(async ({ ctx, input }) => {
      const resource = await resolveScope(ctx, "team", input.teamId);

      await assertAnyPermission(
        ctx,
        ["roles.view", "teams.members.manage"],
        resource,
      );

      const rows = await ctx.db
        .select({
          id: roleAssignments.id,
          roleId: roleAssignments.roleId,
          roleName: roles.name,
          principalType: roleAssignments.principalType,
          principalId: roleAssignments.principalId,
          scopeType: roleAssignments.scopeType,
          scopeId: roleAssignments.scopeId,
        })
        .from(roleAssignments)
        .innerJoin(roles, eq(roles.id, roleAssignments.roleId))
        .where(
          and(
            eq(roleAssignments.organizationId, ctx.activeOrganization.id),
            or(
              and(
                eq(roleAssignments.scopeType, "team"),
                eq(roleAssignments.scopeId, input.teamId),
              ),
              and(
                eq(roleAssignments.principalType, "team"),
                eq(roleAssignments.principalId, input.teamId),
              ),
            ),
          ),
        )
        .orderBy(desc(roleAssignments.createdAt));
      const userIds = rows
        .filter((row) => row.principalType === "user")
        .map((row) => row.principalId);
      const [userRows, teamRoles] = await Promise.all([
        userIds.length
          ? ctx.db
              .select({ id: users.id, name: users.name, email: users.email })
              .from(users)
              .where(inArray(users.id, userIds))
          : [],
        ctx.db
          .select({ id: roles.id, name: roles.name })
          .from(roles)
          .where(
            and(
              eq(roles.organizationId, ctx.activeOrganization.id),
              eq(roles.scope, "team"),
            ),
          )
          .orderBy(asc(roles.name)),
      ]);

      return {
        teamRoles,
        assignments: rows.map((row) => {
          const user = userRows.find((item) => item.id === row.principalId);

          return {
            ...row,
            principalName:
              row.principalType === "user"
                ? (user?.name ?? user?.email ?? "Unknown user")
                : "Whole team",
            scopeName:
              row.scopeType === "organization"
                ? ctx.activeOrganization.name
                : "This team",
          };
        }),
      };
    }),

  assign: protectedProcedure
    .meta({
      permissions: [
        "roles.assign",
        "teams.members.manage",
        "projects.members.manage",
      ],
      audit: ["assignment.created"],
    })
    .input(
      z.object({
        roleId: uuid,
        principalType: z.enum(["user", "team"]),
        principalId: uuid,
        scopeType: scopeSchema,
        scopeId: uuid,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const resource = await resolveScope(ctx, input.scopeType, input.scopeId);

      await assertAnyPermission(ctx, assignKeys[input.scopeType], resource);

      const role = await loadRole(ctx, input.roleId);

      if (role.scope !== input.scopeType) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `This is a ${role.scope} role and cannot be assigned at ${input.scopeType} level.`,
        });
      }

      if (
        role.systemKey === "owner" ||
        role.systemKey === "admin" ||
        role.systemKey === "member"
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Owner, Admin and Member are base roles; change them from the members page.",
        });
      }

      if (input.scopeType === "team") {
        await assertTeamLeadBounds(ctx, input.scopeId, {
          type: input.principalType,
          id: input.principalId,
        });
      }

      if (input.principalType === "user") {
        await assertMayModifyUser(ctx, input.principalId);
      } else {
        const [team] = await ctx.db
          .select({ id: teams.id })
          .from(teams)
          .where(
            and(
              eq(teams.id, input.principalId),
              eq(teams.organizationId, ctx.activeOrganization.id),
            ),
          )
          .limit(1);

        if (!team) {
          throw notFound("Team not found.");
        }
      }

      await assertHoldsAll(ctx.permissions, role.permissions, resource);

      const names = await describeAssignment(ctx, input);

      const assignment = await ctx.db.transaction(async (tx) => {
        const [created] = await tx
          .insert(roleAssignments)
          .values({
            organizationId: ctx.activeOrganization.id,
            roleId: role.id,
            principalType: input.principalType,
            principalId: input.principalId,
            scopeType: input.scopeType,
            scopeId: input.scopeId,
            createdByUserId: ctx.user.id,
          })
          .onConflictDoNothing()
          .returning();

        if (!created) {
          throw conflict("This role is already assigned there.");
        }

        const scope = {
          projectId: input.scopeType === "project" ? input.scopeId : null,
          teamId: input.scopeType === "team" ? input.scopeId : null,
        };
        const details = {
          roleId: role.id,
          roleName: role.name,
          principalType: input.principalType,
          principalId: input.principalId,
          principalName: names.principalName,
          scopeType: input.scopeType,
          scopeId: input.scopeId,
          scopeName: names.scopeName,
        };

        await ctx.audit.record(tx, {
          action: "assignment.created",
          target: {
            id: created.id,
            label: `${role.name} for ${names.principalName ?? "someone"} on ${names.scopeName}`,
          },
          ...scope,
          metadata: { ...details, after: input },
        });

        if (input.scopeType === "project") {
          await ctx.audit.record(tx, {
            action: "project.member_added",
            target: { id: input.scopeId, label: names.scopeName },
            ...scope,
            metadata: details,
          });
        }

        return created;
      });

      return assignment;
    }),

  unassign: protectedProcedure
    .meta({
      permissions: [
        "roles.assign",
        "teams.members.manage",
        "projects.members.manage",
      ],
      audit: ["assignment.removed"],
    })
    .input(z.object({ assignmentId: uuid }))
    .mutation(async ({ ctx, input }) => {
      const [assignment] = await ctx.db
        .select()
        .from(roleAssignments)
        .where(
          and(
            eq(roleAssignments.id, input.assignmentId),
            eq(roleAssignments.organizationId, ctx.activeOrganization.id),
          ),
        )
        .limit(1);

      if (!assignment) {
        throw notFound("Assignment not found.");
      }

      const resource = await resolveScope(
        ctx,
        assignment.scopeType,
        assignment.scopeId,
      );

      await assertAnyPermission(
        ctx,
        assignKeys[assignment.scopeType],
        resource,
      );

      const role = await loadRole(ctx, assignment.roleId);

      if (assignment.principalType === "user") {
        await assertMayModifyUser(ctx, assignment.principalId);
      }

      await assertHoldsAll(ctx.permissions, role.permissions, resource);

      const names = await describeAssignment(ctx, assignment);

      await ctx.db.transaction(async (tx) => {
        await tx
          .delete(roleAssignments)
          .where(eq(roleAssignments.id, assignment.id));

        const scope = {
          projectId:
            assignment.scopeType === "project" ? assignment.scopeId : null,
          teamId: assignment.scopeType === "team" ? assignment.scopeId : null,
        };
        const details = {
          roleId: assignment.roleId,
          roleName: role.name,
          principalType: assignment.principalType,
          principalId: assignment.principalId,
          principalName: names.principalName,
          scopeType: assignment.scopeType,
          scopeId: assignment.scopeId,
          scopeName: names.scopeName,
        };

        await ctx.audit.record(tx, {
          action: "assignment.removed",
          target: {
            id: assignment.id,
            label: `${role.name} for ${names.principalName ?? "someone"} on ${names.scopeName}`,
          },
          ...scope,
          metadata: { ...details, before: details },
        });

        if (assignment.scopeType === "project") {
          await ctx.audit.record(tx, {
            action: "project.member_removed",
            target: { id: assignment.scopeId, label: names.scopeName },
            ...scope,
            metadata: details,
          });
        }
      });

      return { id: assignment.id };
    }),
});

const overridesRouter = router({
  list: permissionProcedure("roles.view")
    .input(z.object({ userId: uuid.optional() }).optional())
    .query(async ({ ctx, input }) => {
      const conditions = [
        eq(permissionOverrides.organizationId, ctx.activeOrganization.id),
      ];

      if (input?.userId) {
        conditions.push(eq(permissionOverrides.userId, input.userId));
      }

      const rows = await ctx.db
        .select()
        .from(permissionOverrides)
        .where(and(...conditions))
        .orderBy(desc(permissionOverrides.createdAt));
      const visibleProjects = new Set(
        await ctx.permissions.viewableProjectIds("projects.view"),
      );

      return rows.filter(
        (row) =>
          row.scopeType !== "project" || visibleProjects.has(row.scopeId),
      );
    }),

  set: protectedProcedure
    .meta({
      permissions: ["permissions.overrides.manage"],
      audit: ["override.set"],
    })
    .input(
      z.object({
        userId: uuid,
        permission: z.string(),
        effect: z.enum(["allow", "deny"]),
        scopeType: scopeSchema,
        scopeId: uuid,
        reason: z.string().trim().max(300).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const resource = await resolveScope(ctx, input.scopeType, input.scopeId);

      await assertAnyPermission(
        ctx,
        ["permissions.overrides.manage"],
        resource,
      );
      await assertMayModifyUser(ctx, input.userId);

      const definition = getPermission(input.permission);

      if (!definition) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Unknown permission ${input.permission}.`,
        });
      }

      if (definition.ownerOnly) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Owner-only permissions cannot be overridden.",
        });
      }

      if (!definition.scopes.includes(input.scopeType)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `${definition.label} cannot be overridden at ${input.scopeType} level.`,
        });
      }

      if (input.effect === "allow") {
        await assertHoldsAll(ctx.permissions, [input.permission], resource);
      }

      const [existing] = await ctx.db
        .select()
        .from(permissionOverrides)
        .where(
          and(
            eq(permissionOverrides.userId, input.userId),
            eq(permissionOverrides.permission, input.permission),
            eq(permissionOverrides.scopeType, input.scopeType),
            eq(permissionOverrides.scopeId, input.scopeId),
          ),
        )
        .limit(1);

      const target = await loadMemberOfOrganization(ctx, input.userId);
      const [person] = await ctx.db
        .select({ name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);
      const personName = person ? person.name || person.email : "someone";

      const override = await ctx.db.transaction(async (tx) => {
        const [row] = await tx
          .insert(permissionOverrides)
          .values({
            organizationId: ctx.activeOrganization.id,
            userId: input.userId,
            permission: input.permission,
            effect: input.effect,
            scopeType: input.scopeType,
            scopeId: input.scopeId,
            reason: input.reason ?? null,
            createdByUserId: ctx.user.id,
          })
          .onConflictDoUpdate({
            target: [
              permissionOverrides.userId,
              permissionOverrides.permission,
              permissionOverrides.scopeType,
              permissionOverrides.scopeId,
            ],
            set: { effect: input.effect, reason: input.reason ?? null },
          })
          .returning();

        await ctx.audit.record(tx, {
          action: "override.set",
          target: {
            id: row!.id,
            label: `${input.effect} ${input.permission} for ${personName}`,
          },
          projectId: input.scopeType === "project" ? input.scopeId : null,
          teamId: input.scopeType === "team" ? input.scopeId : null,
          metadata: {
            userId: input.userId,
            memberId: target?.id,
            personName,
            permission: input.permission,
            effect: input.effect,
            scopeType: input.scopeType,
            scopeId: input.scopeId,
            reason: input.reason ?? null,
            updated: Boolean(existing),
            before: existing ?? null,
            after: row,
          },
        });

        return row!;
      });

      return override;
    }),

  remove: protectedProcedure
    .meta({
      permissions: ["permissions.overrides.manage"],
      audit: ["override.removed"],
    })
    .input(z.object({ id: uuid }))
    .mutation(async ({ ctx, input }) => {
      const [override] = await ctx.db
        .select()
        .from(permissionOverrides)
        .where(
          and(
            eq(permissionOverrides.id, input.id),
            eq(permissionOverrides.organizationId, ctx.activeOrganization.id),
          ),
        )
        .limit(1);

      if (!override) {
        throw notFound("Override not found.");
      }

      const resource = await resolveScope(
        ctx,
        override.scopeType,
        override.scopeId,
      );

      await assertAnyPermission(
        ctx,
        ["permissions.overrides.manage"],
        resource,
      );
      await assertMayModifyUser(ctx, override.userId);

      // Lifting a deny gives the permission back, so it must be one you hold.
      if (override.effect === "deny") {
        await assertHoldsAll(ctx.permissions, [override.permission], resource);
      }

      const [person] = await ctx.db
        .select({ name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, override.userId))
        .limit(1);
      const personName = person ? person.name || person.email : "someone";

      await ctx.db.transaction(async (tx) => {
        await tx
          .delete(permissionOverrides)
          .where(eq(permissionOverrides.id, override.id));

        await ctx.audit.record(tx, {
          action: "override.removed",
          target: {
            id: override.id,
            label: `${override.effect} ${override.permission} for ${personName}`,
          },
          projectId: override.scopeType === "project" ? override.scopeId : null,
          teamId: override.scopeType === "team" ? override.scopeId : null,
          metadata: {
            userId: override.userId,
            personName,
            permission: override.permission,
            effect: override.effect,
            scopeType: override.scopeType,
            scopeId: override.scopeId,
            before: override,
          },
        });
      });

      return { id: override.id };
    }),
});

// Permission-related events in the order they happened. The log is read from
// the unified activity store.
const permissionLogActions = [
  "role.%",
  "assignment.%",
  "override.%",
  "member.role_updated",
  "member.removed",
  "org.ownership_transferred",
  "org.updated",
  "invitation.%",
  "project.visibility_changed",
  "project.member_%",
];

const logRouter = router({
  list: permissionProcedure("permissions.log.view")
    .input(
      z
        .object({
          limit: z.number().int().min(1).max(100).default(30),
          cursor: cursorSchema.optional(),
          actorUserId: uuid.optional(),
          targetType: z.string().optional(),
          targetId: z.string().optional(),
        })
        .default({ limit: 30 }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [
        eq(activityEvents.organizationId, ctx.activeOrganization.id),
        or(
          ...permissionLogActions.map((pattern) =>
            like(activityEvents.action, pattern),
          ),
        ),
        cursorCondition(input.cursor),
      ];

      if (input.actorUserId) {
        conditions.push(eq(activityEvents.actorUserId, input.actorUserId));
      }

      if (input.targetType) {
        conditions.push(eq(activityEvents.targetType, input.targetType));
      }

      if (input.targetId) {
        conditions.push(eq(activityEvents.targetId, input.targetId));
      }

      const rows = await ctx.db
        .select({
          id: activityEvents.id,
          action: activityEvents.action,
          targetType: activityEvents.targetType,
          targetId: activityEvents.targetId,
          targetLabel: activityEvents.targetLabel,
          metadata: activityEvents.metadata,
          createdAt: activityEvents.createdAt,
          actorUserId: activityEvents.actorUserId,
          actorName: users.name,
        })
        .from(activityEvents)
        .leftJoin(users, eq(users.id, activityEvents.actorUserId))
        .where(and(...conditions))
        .orderBy(desc(activityEvents.createdAt), desc(activityEvents.id))
        .limit(input.limit + 1);

      const hasMore = rows.length > input.limit;
      const items = (hasMore ? rows.slice(0, input.limit) : rows).map(
        ({ metadata, ...row }) => ({
          ...row,
          before: metadata?.before ?? null,
          after: metadata?.after ?? null,
          metadata,
        }),
      );

      return {
        items,
        nextCursor: hasMore ? encodeCursor(items[items.length - 1]!) : null,
      };
    }),
});

function permissionMap(
  snapshot: PermissionSnapshot,
  resource: ResourceContext,
) {
  return Object.fromEntries(
    getCatalog().map((entry) => [
      entry.key,
      engineCheck(snapshot, entry.key, resource).allowed,
    ]),
  );
}

export const permissionsRouter = router({
  // Describes what exists; shown to people who may see roles.
  catalog: permissionProcedure("roles.view").query(async ({ ctx }) => {
    const enabled = await loadEnabledModules(ctx.db, ctx.activeOrganization.id);

    return {
      permissions: getCatalog().map((entry) => ({
        key: entry.key,
        label: entry.label,
        description: entry.description,
        module: entry.module,
        group: entry.group,
        scopes: entry.scopes,
        ownerOnly: Boolean(entry.ownerOnly),
        uiOnly: entry.uiOnly ?? null,
        // Permissions of a turned-off module are hidden and inert.
        enabled:
          entry.module === "platform" || enabled.has(entry.module as never),
      })),
    };
  }),

  // The caller's own permissions; always available to a signed-in member.
  me: protectedProcedure.query(async ({ ctx }) => {
    const snapshot = await ctx.permissions.snapshot();

    return {
      baseRole: snapshot.baseRole,
      userId: snapshot.userId,
      permissions: permissionMap(snapshot, {}),
      // Held organization-wide or in at least one project or team; decides
      // which modules and routes the caller sees.
      reachable: await ctx.permissions.reachable(
        getCatalog().map((entry) => entry.key),
      ),
    };
  }),

  // The caller's permissions for one project or team. `ownerUserId` is the
  // creator of the item on screen, so `_own` permissions resolve for it.
  check: protectedProcedure
    .input(
      z.object({
        projectId: uuid.optional(),
        teamId: uuid.optional(),
        ownerUserId: uuid.optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const snapshot = await ctx.permissions.snapshot();
      const project = input.projectId
        ? ((await loadProjectById(ctx, input.projectId)) ?? null)
        : null;

      return {
        permissions: permissionMap(snapshot, {
          project,
          teamId: input.teamId ?? null,
          ownerUserId: input.ownerUserId ?? null,
        }),
      };
    }),

  explain: permissionProcedure("permissions.explain")
    .input(
      z.object({
        userId: uuid,
        permission: z.string(),
        projectId: uuid.optional(),
        teamId: uuid.optional(),
        ownerUserId: uuid.optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const target = await loadMemberOfOrganization(ctx, input.userId);

      if (!target) {
        throw notFound("That person is not a member of this organization.");
      }

      if (!getPermission(input.permission)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Unknown permission ${input.permission}.`,
        });
      }

      const snapshot = await loadPermissionSnapshot(
        ctx.db,
        ctx.activeOrganization.id,
        input.userId,
      );
      const project = input.projectId
        ? ((await loadProjectById(ctx, input.projectId)) ?? null)
        : null;
      const decision = engineCheck(snapshot, input.permission, {
        project,
        teamId: input.teamId ?? null,
        ownerUserId: input.ownerUserId ?? null,
      });

      return {
        allowed: decision.allowed,
        reasons: decision.reasons,
        baseRole: snapshot.baseRole,
      };
    }),

  roles: rolesRouter,
  assignments: assignmentsRouter,
  overrides: overridesRouter,
  log: logRouter,
});
