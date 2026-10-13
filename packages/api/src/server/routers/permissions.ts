import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq, inArray, lt } from "@zentro/db/drizzle";
import {
  members,
  permissionChangeLogs,
  permissionOverrides,
  projects,
  roleAssignments,
  roles,
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

import { assertHoldsAll, logPermissionChange } from "../access";
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

/** Self-service and owner protection shared by assignments and overrides. */
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

  create: permissionProcedure("roles.create")
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

      const [role] = await ctx.db
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

      if (!role) {
        throw conflict("A role with this name already exists.");
      }

      await logPermissionChange(ctx.db, {
        organizationId: ctx.activeOrganization.id,
        actorUserId: ctx.user.id,
        action: "role.created",
        targetType: "role",
        targetId: role.id,
        after: summarizeRole(role),
      });

      return role;
    }),

  update: permissionProcedure("roles.update")
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

      const [updated] = await ctx.db
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

      await logPermissionChange(ctx.db, {
        organizationId: ctx.activeOrganization.id,
        actorUserId: ctx.user.id,
        action: "role.updated",
        targetType: "role",
        targetId: role.id,
        before: summarizeRole(role),
        after: summarizeRole(updated!),
      });

      return updated!;
    }),

  delete: permissionProcedure("roles.delete")
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

      await ctx.db.delete(roles).where(eq(roles.id, role.id));

      await logPermissionChange(ctx.db, {
        organizationId: ctx.activeOrganization.id,
        actorUserId: ctx.user.id,
        action: "role.deleted",
        targetType: "role",
        targetId: role.id,
        before: summarizeRole(role),
      });

      return { id: role.id };
    }),

  clone: permissionProcedure("roles.create")
    .input(z.object({ id: uuid, name: roleInput.name }))
    .mutation(async ({ ctx, input }) => {
      const source = await loadRole(ctx, input.id);
      // Owner-only keys never travel into a custom role.
      const keys = source.permissions.filter(
        (key) => !getPermission(key)?.ownerOnly,
      );

      await assertHoldsAll(ctx.permissions, keys);

      const [role] = await ctx.db
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

      if (!role) {
        throw conflict("A role with this name already exists.");
      }

      await logPermissionChange(ctx.db, {
        organizationId: ctx.activeOrganization.id,
        actorUserId: ctx.user.id,
        action: "role.cloned",
        targetType: "role",
        targetId: role.id,
        before: { clonedFrom: source.id },
        after: summarizeRole(role),
      });

      return role;
    }),

  resetSystem: permissionProcedure("roles.update")
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

      const [updated] = await ctx.db
        .update(roles)
        .set({ permissions: definition.permissions, updatedAt: new Date() })
        .where(eq(roles.id, role.id))
        .returning();

      await logPermissionChange(ctx.db, {
        organizationId: ctx.activeOrganization.id,
        actorUserId: ctx.user.id,
        action: "role.reset",
        targetType: "role",
        targetId: role.id,
        before: summarizeRole(role),
        after: summarizeRole(updated!),
      });

      return updated!;
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

      const rows = await ctx.db
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

  assign: protectedProcedure
    .meta({
      permissions: [
        "roles.assign",
        "teams.members.manage",
        "projects.members.manage",
      ],
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

      const [assignment] = await ctx.db
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

      if (!assignment) {
        throw conflict("This role is already assigned there.");
      }

      await logPermissionChange(ctx.db, {
        organizationId: ctx.activeOrganization.id,
        actorUserId: ctx.user.id,
        action: "assignment.created",
        targetType: input.scopeType,
        targetId: input.scopeId,
        after: { ...input, roleName: role.name },
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

      await ctx.db
        .delete(roleAssignments)
        .where(eq(roleAssignments.id, assignment.id));

      await logPermissionChange(ctx.db, {
        organizationId: ctx.activeOrganization.id,
        actorUserId: ctx.user.id,
        action: "assignment.removed",
        targetType: assignment.scopeType,
        targetId: assignment.scopeId,
        before: {
          roleId: assignment.roleId,
          roleName: role.name,
          principalType: assignment.principalType,
          principalId: assignment.principalId,
        },
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

      return ctx.db
        .select()
        .from(permissionOverrides)
        .where(and(...conditions))
        .orderBy(desc(permissionOverrides.createdAt));
    }),

  set: protectedProcedure
    .meta({ permissions: ["permissions.overrides.manage"] })
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

      const [override] = await ctx.db
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

      await logPermissionChange(ctx.db, {
        organizationId: ctx.activeOrganization.id,
        actorUserId: ctx.user.id,
        action: existing ? "override.updated" : "override.created",
        targetType: "user",
        targetId: input.userId,
        before: existing ?? null,
        after: override,
      });

      return override!;
    }),

  remove: protectedProcedure
    .meta({ permissions: ["permissions.overrides.manage"] })
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

      await ctx.db
        .delete(permissionOverrides)
        .where(eq(permissionOverrides.id, override.id));

      await logPermissionChange(ctx.db, {
        organizationId: ctx.activeOrganization.id,
        actorUserId: ctx.user.id,
        action: "override.removed",
        targetType: "user",
        targetId: override.userId,
        before: override,
      });

      return { id: override.id };
    }),
});

const logRouter = router({
  list: permissionProcedure("permissions.log.view")
    .input(
      z
        .object({
          limit: z.number().int().min(1).max(100).default(30),
          cursor: z.string().optional(),
          actorUserId: uuid.optional(),
          targetType: z.string().optional(),
          targetId: z.string().optional(),
        })
        .default({ limit: 30 }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [
        eq(permissionChangeLogs.organizationId, ctx.activeOrganization.id),
      ];

      if (input.actorUserId) {
        conditions.push(
          eq(permissionChangeLogs.actorUserId, input.actorUserId),
        );
      }

      if (input.targetType) {
        conditions.push(eq(permissionChangeLogs.targetType, input.targetType));
      }

      if (input.targetId) {
        conditions.push(eq(permissionChangeLogs.targetId, input.targetId));
      }

      if (input.cursor) {
        conditions.push(
          lt(permissionChangeLogs.createdAt, new Date(input.cursor)),
        );
      }

      const rows = await ctx.db
        .select({
          id: permissionChangeLogs.id,
          action: permissionChangeLogs.action,
          targetType: permissionChangeLogs.targetType,
          targetId: permissionChangeLogs.targetId,
          before: permissionChangeLogs.before,
          after: permissionChangeLogs.after,
          createdAt: permissionChangeLogs.createdAt,
          actorUserId: permissionChangeLogs.actorUserId,
          actorName: users.name,
        })
        .from(permissionChangeLogs)
        .leftJoin(users, eq(users.id, permissionChangeLogs.actorUserId))
        .where(and(...conditions))
        .orderBy(
          desc(permissionChangeLogs.createdAt),
          desc(permissionChangeLogs.id),
        )
        .limit(input.limit + 1);

      const hasMore = rows.length > input.limit;
      const items = hasMore ? rows.slice(0, input.limit) : rows;

      return {
        items,
        nextCursor: hasMore
          ? items[items.length - 1]!.createdAt.toISOString()
          : null,
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
      permissions: permissionMap(snapshot, {}),
    };
  }),

  // The caller's permissions for one project or team.
  check: protectedProcedure
    .input(z.object({ projectId: uuid.optional(), teamId: uuid.optional() }))
    .query(async ({ ctx, input }) => {
      const snapshot = await ctx.permissions.snapshot();
      const project = input.projectId
        ? ((await loadProjectById(ctx, input.projectId)) ?? null)
        : null;

      return {
        permissions: permissionMap(snapshot, {
          project,
          teamId: input.teamId ?? null,
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
