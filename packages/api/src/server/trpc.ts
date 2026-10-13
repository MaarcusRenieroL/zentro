import { initTRPC, TRPCError } from "@trpc/server";
import {
  hasOrganizationPermission,
  type OrganizationRole,
  type PermissionRequest,
} from "@zentro/auth";
import superjson from "superjson";
import { ZodError } from "zod";

import type { TRPCContext } from "../types";

const trpc = initTRPC.context<TRPCContext>().create({
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

export const organizationProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!ctx.activeOrganization) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "No active organization selected",
    });
  }

  return next({
    ctx: {
      ...ctx,
      activeOrganization: ctx.activeOrganization,
    },
  });
});

type ActiveOrganizationWithMembers = {
  members?: {
    userId?: string | null;
    role?: string | null;
  }[];
};

// getFullOrganization returns every member, so the role must come from the
// member that belongs to the current user. No matching member means no access.
function getCurrentMemberRole(
  activeOrganization: ActiveOrganizationWithMembers,
  userId: string,
): OrganizationRole | null {
  const member = activeOrganization.members?.find(
    (candidate) => candidate.userId === userId,
  );

  return member?.role ? (member.role as OrganizationRole) : null;
}

export const adminProcedure = organizationProcedure.use(({ ctx, next }) => {
  const activeOrganization =
    ctx.activeOrganization as ActiveOrganizationWithMembers;

  const role = getCurrentMemberRole(activeOrganization, ctx.user.id);

  if (
    !role ||
    !hasOrganizationPermission(role, {
      organization: ["update"],
    })
  ) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You must be an organization admin to perform this action",
    });
  }

  return next({
    ctx,
  });
});

export const authorizedProcedure = (permission: PermissionRequest) =>
  organizationProcedure.use(({ ctx, next }) => {
    const activeOrganization =
      ctx.activeOrganization as ActiveOrganizationWithMembers;

    const role = getCurrentMemberRole(activeOrganization, ctx.user.id);

    if (!role || !hasOrganizationPermission(role, permission)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have permission to perform this action",
      });
    }

    return next({
      ctx,
    });
  });
