import { invitations, organizations, users } from "@zentro/db/schema";
import { protectedProcedure, router } from "../trpc";
import { and, eq, gt, isNull, or } from "@zentro/db/drizzle";

export const userRouter = router({
  listPendingInvites: protectedProcedure.query(async ({ ctx }) => {
    const { user } = ctx;

    return ctx.db
      .select({
        id: invitations.id,
        orgName: organizations.name,
        orgSlug: organizations.slug,
        role: invitations.role,
        invitedBy: users.name,
      })
      .from(invitations)
      .innerJoin(users, eq(users.id, invitations.inviterId))
      .innerJoin(
        organizations,
        eq(organizations.id, invitations.organizationId),
      )
      .where(
        and(
          eq(invitations.email, user.email),
          eq(invitations.status, "pending"),
          or(
            isNull(invitations.expiresAt),
            gt(invitations.expiresAt, new Date()),
          ),
        ),
      );
  }),
});
