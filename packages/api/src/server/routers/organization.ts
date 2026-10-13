import { TRPCError } from "@trpc/server";
import { and, count, eq } from "@zentro/db/drizzle";
import { invitations, members, organizations, users } from "@zentro/db/schema";

import { orgInviteDetailsSchema } from "../../types/zod-schema";
import { z } from "zod";

import { auth } from "@zentro/auth";

import { logPermissionChange } from "../access";
import { callAuth } from "../auth-calls";
import { authenticatedProcedure, permissionProcedure, router } from "../trpc";

export const organizationRouter = router({
  update: permissionProcedure("org.settings.update")
    .input(
      z.object({
        name: z.string().trim().min(1).max(120).optional(),
        logo: z.string().trim().max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { db, user, activeOrganization } = ctx;

      await callAuth(() =>
        auth.api.updateOrganization({
          headers: ctx.headers,
          body: { data: input, organizationId: activeOrganization.id },
        }),
      );

      await logPermissionChange(db, {
        organizationId: activeOrganization.id,
        actorUserId: user.id,
        action: "organization.updated",
        targetType: "organization",
        targetId: activeOrganization.id,
        before: { name: activeOrganization.name },
        after: input,
      });

      return { id: activeOrganization.id };
    }),

  // Owner only (org.delete is an owner-only permission).
  delete: permissionProcedure("org.delete").mutation(async ({ ctx }) => {
    await callAuth(() =>
      auth.api.deleteOrganization({
        headers: ctx.headers,
        body: { organizationId: ctx.activeOrganization.id },
      }),
    );

    return { id: ctx.activeOrganization.id };
  }),

  getInviteDetails: authenticatedProcedure
    .input(orgInviteDetailsSchema)
    .query(async ({ input, ctx }) => {
      const { invitationId } = input;

      const [invite] = await ctx.db
        .select({
          invitationId: invitations.id,
          email: invitations.email,
          organizationId: invitations.organizationId,
          role: invitations.role,
          expiresAt: invitations.expiresAt,
          status: invitations.status,

          inviterName: users.name,

          organizationName: organizations.name,
          organizationSlug: organizations.slug,
          organizationLogo: organizations.logo,
        })
        .from(invitations)
        .innerJoin(users, eq(users.id, invitations.inviterId))
        .innerJoin(
          organizations,
          eq(organizations.id, invitations.organizationId),
        )
        .where(eq(invitations.id, invitationId))
        .limit(1);

      if (!invite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found.",
        });
      }

      // Only the invited address may read an invitation. Anything else looks
      // the same as an unknown id, so invitation ids cannot be probed.
      if (invite.email.toLowerCase() !== ctx.user.email.toLowerCase()) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found.",
        });
      }

      if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
        await ctx.db
          .update(invitations)
          .set({
            status: "expired",
          })
          .where(
            and(
              eq(invitations.id, invitationId),
              eq(invitations.status, "pending"),
            ),
          );

        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invitation expired. Please request a new one.",
        });
      }

      const [totalMembers] = await ctx.db
        .select({ count: count() })
        .from(members)
        .where(eq(members.organizationId, invite.organizationId));

      if (!totalMembers) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to load organization member count.",
        });
      }

      return {
        invitationId: invite.invitationId,
        organizationId: invite.organizationId,
        organizationName: invite.organizationName,
        organizationSlug: invite.organizationSlug,
        organizationLogo: invite.organizationLogo,
        inviterName: invite.inviterName,
        role: invite.role,
        expiresAt: invite.expiresAt,
        status: invite.status,
        membersCount: totalMembers.count,
      };
    }),
});
