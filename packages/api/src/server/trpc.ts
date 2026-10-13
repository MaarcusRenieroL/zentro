import { initTRPC, TRPCError } from "@trpc/server";
import type { Decision, ResourceContext } from "@zentro/permissions";
import superjson from "superjson";
import { ZodError } from "zod";

import type { ModuleId } from "@zentro/modules";

import type { TRPCContext } from "../types";

export type ProcedureMeta = {
  /**
   * Permission keys the procedure enforces (any of them is enough). The
   * coverage test requires every procedure to declare keys here or to be on
   * the explicit allowlist.
   */
  permissions?: string[];
};

const trpc = initTRPC
  .context<TRPCContext>()
  .meta<ProcedureMeta>()
  .create({
    transformer: superjson,
    errorFormatter({ shape, error }) {
      return {
        ...shape,
        data: {
          ...shape.data,
          zodError:
            error.cause instanceof ZodError ? error.cause.flatten() : null,
        },
      };
    },
  });

export const router = trpc.router;
export const publicProcedure = trpc.procedure;

/** Requires a session but, unlike protectedProcedure, no active organization. */
export const authenticatedProcedure = trpc.procedure.use(({ ctx, next }) => {
  if (!ctx.user?.id) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in",
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = trpc.procedure.use(({ ctx, next }) => {
  if (!ctx.user?.id) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in",
    });
  }

  if (!ctx.activeOrganization) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "No active organization selected",
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      activeOrganization: ctx.activeOrganization,
    },
  });
});

export const organizationProcedure = protectedProcedure;

/**
 * Rejects the call when the module is turned off for the caller's active
 * organization. The enabled set is loaded once per request by the context.
 */
export const moduleProcedure = (moduleId: ModuleId) =>
  protectedProcedure.use(async ({ ctx, next }) => {
    const enabledModules = await ctx.enabledModules();

    if (!enabledModules.has(moduleId)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Module disabled",
      });
    }

    return next({ ctx });
  });

type OrganizationContext = TRPCContext & {
  user: NonNullable<TRPCContext["user"]>;
  activeOrganization: NonNullable<TRPCContext["activeOrganization"]>;
};

/**
 * Tells the permission engine which team, project or owner a call targets.
 * `input` is the raw, not yet validated input of the procedure.
 */
export type ScopeResolver = (args: {
  ctx: OrganizationContext;
  input: unknown;
}) => Promise<ResourceContext | undefined> | ResourceContext | undefined;

/** Hidden things look like missing things, so ids cannot be probed. */
export function denialFor(decision: Decision) {
  if (decision.reasons.some((reason) => reason.kind === "visibility")) {
    return new TRPCError({ code: "NOT_FOUND", message: "Not found." });
  }

  return new TRPCError({
    code: "FORBIDDEN",
    message: "You do not have permission to perform this action",
  });
}

/** Throws unless the caller holds at least one of the permissions. */
export async function assertAnyPermission(
  ctx: OrganizationContext,
  permissions: string[],
  resource: ResourceContext = {},
) {
  let last: Decision | undefined;

  for (const permission of permissions) {
    const decision = await ctx.permissions.check(permission, resource);

    if (decision.allowed) {
      return;
    }

    last = decision;
  }

  throw denialFor(last ?? { allowed: false, reasons: [] });
}

/**
 * The one way to protect a procedure: the module (when given) must be on, then
 * the caller must hold the permission for the resource the resolver names.
 */
export const permissionProcedure = (
  permission: string,
  resolve?: ScopeResolver,
  options: {
    module?: ModuleId;
    /** Further keys the handler checks itself (declared for the coverage test). */
    also?: string[];
  } = {},
) => {
  const base = options.module
    ? moduleProcedure(options.module)
    : protectedProcedure;

  return base
    .meta({ permissions: [permission, ...(options.also ?? [])] })
    .use(async (opts) => {
      const { ctx, next, getRawInput } = opts;
      const resource = resolve
        ? await resolve({
            ctx: ctx as OrganizationContext,
            input: await getRawInput(),
          })
        : undefined;

      await assertAnyPermission(
        ctx as OrganizationContext,
        [permission],
        resource,
      );

      return next({ ctx });
    });
};

/**
 * For list procedures: no single resource to check, so the caller only needs
 * to be a member. The procedure filters its results with
 * `ctx.permissions.viewableProjectIds`.
 */
export const listProcedure = (permission: string, moduleId?: ModuleId) => {
  const base = moduleId ? moduleProcedure(moduleId) : protectedProcedure;

  return base.meta({ permissions: [permission] }).use(async ({ ctx, next }) => {
    const snapshot = await ctx.permissions.snapshot();

    if (!snapshot.baseRole && !snapshot.assignments.length) {
      throw denialFor({ allowed: false, reasons: [] });
    }

    return next({ ctx });
  });
};

export type { OrganizationContext };
