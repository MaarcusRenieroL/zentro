import { TRPCError } from "@trpc/server";
import { count, eq } from "@zentro/db/drizzle";
import { invitations, members, organizations, users } from "@zentro/db/schema";

import { orgInviteDetailsSchema } from "../../types/zod-schema";
import { publicProcedure, router } from "../trpc";

export const organizationRouter = router({
  getInviteDetails: publicProcedure
    .input(orgInviteDetailsSchema)
    .query(async ({ input, ctx }) => {
      const { invitationId } = input;

      const [invite] = await ctx.db
        .select({
          invitationId: invitations.id,
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

      if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
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
