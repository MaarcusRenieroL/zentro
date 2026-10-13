import { invitations, organizations, users } from "@zentro/db/schema";
import { authenticatedProcedure, router } from "../trpc";
import { and, eq, gt, isNull, or, sql } from "@zentro/db/drizzle";

export const userRouter = router({
  // Session only: a new user has no active organization yet.
  listPendingInvites: authenticatedProcedure.query(async ({ ctx }) => {
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
          sql`lower(${invitations.email}) = lower(${user.email})`,
          eq(invitations.status, "pending"),
          or(
            isNull(invitations.expiresAt),
            gt(invitations.expiresAt, new Date()),
          ),
        ),
      );
  }),
});
