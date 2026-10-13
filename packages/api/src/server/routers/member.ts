import { TRPCError } from "@trpc/server";
import { auth } from "@zentro/auth";
import { and, asc, eq } from "@zentro/db/drizzle";
import { members, roles, users } from "@zentro/db/schema";
import { z } from "zod";

import { assertHoldsAll } from "../access";
import { callAuth } from "../auth-calls";
import { permissionProcedure, router } from "../trpc";

const memberIdSchema = z.object({ memberId: z.string().uuid() });

async function loadTargetMember(
  ctx: {
    db: typeof import("@zentro/db").db;
    activeOrganization: { id: string };
  },
  memberId: string,
) {
  const [target] = await ctx.db
    .select({ id: members.id, userId: members.userId, role: members.role })
    .from(members)
    .where(
      and(
        eq(members.id, memberId),
        eq(members.organizationId, ctx.activeOrganization.id),
      ),
    )
    .limit(1);

  if (!target) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Member not found." });
  }

  return target;
}

async function userLabel(
  ctx: { db: typeof import("@zentro/db").db },
  userId: string,
) {
  const [row] = await ctx.db
    .select({ name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return row ? row.name || row.email : null;
}

const isOwner = (role: string) =>
  role
    .split(",")
    .map((part) => part.trim())
    .includes("owner");

export const memberRouter = router({
  getMembers: permissionProcedure("members.view").query(async ({ ctx }) => {
    const { activeOrganization, db } = ctx;

    return db
      .select({
        id: members.id,
        role: members.role,
        userId: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
      })
      .from(members)
      .innerJoin(users, eq(users.id, members.userId))
      .where(eq(members.organizationId, activeOrganization.id))
      .orderBy(asc(users.name), asc(users.email));
  }),

  // Changes a member's base organization role (admin or member).
  updateRole: permissionProcedure("members.role.update", undefined, {
    audit: ["member.role_updated"],
  })
    .input(memberIdSchema.extend({ role: z.enum(["admin", "member"]) }))
    .mutation(async ({ ctx, input }) => {
      const { db, user, activeOrganization } = ctx;
      const target = await loadTargetMember(ctx, input.memberId);

      if (isOwner(target.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "An owner's role can only change through an ownership transfer.",
        });
      }

      if (target.userId === user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot change your own role.",
        });
      }

      // Promoting someone to a role is giving them everything it grants.
      const [role] = await db
        .select({ permissions: roles.permissions })
        .from(roles)
        .where(
          and(
            eq(roles.organizationId, activeOrganization.id),
            eq(roles.systemKey, input.role),
          ),
        )
        .limit(1);

      await assertHoldsAll(ctx.permissions, role?.permissions ?? []);

      await callAuth(() =>
        auth.api.updateMemberRole({
          headers: ctx.headers,
          body: {
            memberId: target.id,
            role: input.role,
            organizationId: activeOrganization.id,
          },
        }),
      );

      await ctx.audit.record(db, {
        action: "member.role_updated",
        target: { id: target.id, label: await userLabel(ctx, target.userId) },
        changes: [{ field: "role", from: target.role, to: input.role }],
        metadata: {
          userId: target.userId,
          before: { role: target.role },
          after: { role: input.role },
        },
      });

      return { memberId: target.id, role: input.role };
    }),

  remove: permissionProcedure("members.remove", undefined, {
    audit: ["member.removed"],
  })
    .input(memberIdSchema)
    .mutation(async ({ ctx, input }) => {
      const { db, user, activeOrganization } = ctx;
      const target = await loadTargetMember(ctx, input.memberId);

      if (isOwner(target.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "An owner cannot be removed.",
        });
      }

      if (target.userId === user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Leave the organization instead of removing yourself.",
        });
      }

      const label = await userLabel(ctx, target.userId);

      await callAuth(() =>
        auth.api.removeMember({
          headers: ctx.headers,
          body: {
            memberIdOrEmail: target.id,
            organizationId: activeOrganization.id,
          },
        }),
      );

      await ctx.audit.record(db, {
        action: "member.removed",
        target: { id: target.id, label },
        metadata: {
          userId: target.userId,
          before: { userId: target.userId, role: target.role },
        },
      });

      return { memberId: target.id };
    }),

  // Owner only: the target becomes an owner and the caller steps down to admin.
  transferOwnership: permissionProcedure("org.ownership.transfer", undefined, {
    audit: ["org.ownership_transferred"],
  })
    .input(memberIdSchema)
    .mutation(async ({ ctx, input }) => {
      const { db, user, activeOrganization } = ctx;
      const target = await loadTargetMember(ctx, input.memberId);

      if (target.userId === user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You already own this organization.",
        });
      }

      const label = await userLabel(ctx, target.userId);

      await db.transaction(async (tx) => {
        await tx
          .update(members)
          .set({ role: "owner" })
          .where(eq(members.id, target.id));
        await tx
          .update(members)
          .set({ role: "admin" })
          .where(
            and(
              eq(members.userId, user.id),
              eq(members.organizationId, activeOrganization.id),
            ),
          );

        await ctx.audit.record(tx, {
          action: "org.ownership_transferred",
          target: { id: target.id, label },
          metadata: {
            userId: target.userId,
            before: { ownerUserId: user.id },
            after: { ownerUserId: target.userId },
          },
        });
      });

      return { memberId: target.id };
    }),
});
