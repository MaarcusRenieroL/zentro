import { TRPCError } from "@trpc/server";
import { and, asc, eq, inArray, isNull, ne } from "@zentro/db/drizzle";
import { members, teamMembers, teams, users } from "@zentro/db/schema";

import {
  createTeamSchema,
  deleteTeamSchema,
  getTeamByIdSchema,
  updateTeamMembersSchema,
  updateTeamSchema,
} from "../../types/zod-schema";
import { authorizedProcedure, organizationProcedure, router } from "../trpc";

type TeamDbClient = Pick<
  typeof import("@zentro/db").db,
  "delete" | "insert" | "select" | "update"
>;

async function getCurrentMemberId({
  db,
  organizationId,
  userId,
}: {
  db: TeamDbClient;
  organizationId: string;
  userId: string;
}) {
  const [member] = await db
    .select({ id: members.id })
    .from(members)
    .where(
      and(
        eq(members.organizationId, organizationId),
        eq(members.userId, userId),
      ),
    )
    .limit(1);

  if (!member) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Member not found in active organization.",
    });
  }

  return member.id;
}

async function assertTeamInOrganization({
  db,
  organizationId,
  teamId,
}: {
  db: TeamDbClient;
  organizationId: string;
  teamId: string;
}) {
  const [team] = await db
    .select({ id: teams.id })
    .from(teams)
    .where(
      and(
        eq(teams.id, teamId),
        eq(teams.organizationId, organizationId),
        isNull(teams.archivedAt),
      ),
    )
    .limit(1);

  if (!team) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Team not found.",
    });
  }

  return team;
}

async function assertMembersInOrganization({
  db,
  organizationId,
  memberIds,
}: {
  db: TeamDbClient;
  organizationId: string;
  memberIds: string[];
}) {
  const uniqueMemberIds = Array.from(new Set(memberIds));

  if (!uniqueMemberIds.length) {
    return uniqueMemberIds;
  }

  const existingMembers = await db
    .select({ id: members.id })
    .from(members)
    .where(
      and(
        eq(members.organizationId, organizationId),
        inArray(members.id, uniqueMemberIds),
      ),
    );

  if (existingMembers.length !== uniqueMemberIds.length) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "One or more members do not belong to this organization.",
    });
  }

  return uniqueMemberIds;
}

async function replaceTeamMembers({
  db,
  organizationId,
  teamId,
  memberIds,
}: {
  db: TeamDbClient;
  organizationId: string;
  teamId: string;
  memberIds: string[];
}) {
  const uniqueMemberIds = await assertMembersInOrganization({
    db,
    organizationId,
    memberIds,
  });

  await db.delete(teamMembers).where(eq(teamMembers.teamId, teamId));

  if (uniqueMemberIds.length) {
    await db.insert(teamMembers).values(
      uniqueMemberIds.map((memberId) => ({
        organizationId,
        teamId,
        memberId,
      })),
    );
  }

  return uniqueMemberIds;
}

export const teamRouter = router({
  getAll: organizationProcedure.query(async ({ ctx }) => {
    const { activeOrganization, db } = ctx;

    const teamRows = await db
      .select({
        id: teams.id,
        name: teams.name,
        description: teams.description,
        color: teams.color,
        createdByMemberId: teams.createdByMemberId,
        createdAt: teams.createdAt,
        updatedAt: teams.updatedAt,
      })
      .from(teams)
      .where(
        and(
          eq(teams.organizationId, activeOrganization.id),
          isNull(teams.archivedAt),
        ),
      )
      .orderBy(asc(teams.name));

    const memberships = await db
      .select({
        id: teamMembers.id,
        teamId: teamMembers.teamId,
        memberId: members.id,
        role: members.role,
        userId: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
        createdAt: teamMembers.createdAt,
      })
      .from(teamMembers)
      .innerJoin(members, eq(members.id, teamMembers.memberId))
      .innerJoin(users, eq(users.id, members.userId))
      .where(eq(teamMembers.organizationId, activeOrganization.id))
      .orderBy(asc(users.name), asc(users.email));

    return teamRows.map((team) => ({
      ...team,
      members: memberships.filter(
        (membership) => membership.teamId === team.id,
      ),
    }));
  }),

  getById: organizationProcedure
    .input(getTeamByIdSchema)
    .query(async ({ ctx, input }) => {
      const { activeOrganization, db } = ctx;

      const [team] = await db
        .select({
          id: teams.id,
          name: teams.name,
          description: teams.description,
          color: teams.color,
          createdByMemberId: teams.createdByMemberId,
          createdAt: teams.createdAt,
          updatedAt: teams.updatedAt,
        })
        .from(teams)
        .where(
          and(
            eq(teams.id, input.id),
            eq(teams.organizationId, activeOrganization.id),
            isNull(teams.archivedAt),
          ),
        )
        .limit(1);

      if (!team) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Team not found.",
        });
      }

      const memberships = await db
        .select({
          id: teamMembers.id,
          teamId: teamMembers.teamId,
          memberId: members.id,
          role: members.role,
          userId: users.id,
          name: users.name,
          email: users.email,
          image: users.image,
          createdAt: teamMembers.createdAt,
        })
        .from(teamMembers)
        .innerJoin(members, eq(members.id, teamMembers.memberId))
        .innerJoin(users, eq(users.id, members.userId))
        .where(
          and(
            eq(teamMembers.organizationId, activeOrganization.id),
            eq(teamMembers.teamId, team.id),
          ),
        )
        .orderBy(asc(users.name), asc(users.email));

      return {
        ...team,
        members: memberships,
      };
    }),

  getAvailableMembers: organizationProcedure.query(async ({ ctx }) => {
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

  create: authorizedProcedure({ team: ["create"] })
    .input(createTeamSchema)
    .mutation(async ({ ctx, input }) => {
      const { activeOrganization, db, user } = ctx;

      return db.transaction(async (tx) => {
        const createdByMemberId = await getCurrentMemberId({
          db: tx,
          organizationId: activeOrganization.id,
          userId: user.id,
        });

        const [existingTeam] = await tx
          .select({ id: teams.id })
          .from(teams)
          .where(
            and(
              eq(teams.organizationId, activeOrganization.id),
              eq(teams.name, input.name),
              isNull(teams.archivedAt),
            ),
          )
          .limit(1);

        if (existingTeam) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A team with this name already exists.",
          });
        }

        const [team] = await tx
          .insert(teams)
          .values({
            organizationId: activeOrganization.id,
            name: input.name,
            description: input.description || null,
            color: input.color,
            createdByMemberId,
          })
          .returning();

        if (!team) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create team.",
          });
        }

        await replaceTeamMembers({
          db: tx,
          organizationId: activeOrganization.id,
          teamId: team.id,
          memberIds: input.memberIds,
        });

        return team;
      });
    }),

  update: authorizedProcedure({ team: ["update"] })
    .input(updateTeamSchema)
    .mutation(async ({ ctx, input }) => {
      const { activeOrganization, db } = ctx;

      await assertTeamInOrganization({
        db,
        organizationId: activeOrganization.id,
        teamId: input.id,
      });

      const [nameConflict] = await db
        .select({ id: teams.id })
        .from(teams)
        .where(
          and(
            eq(teams.organizationId, activeOrganization.id),
            eq(teams.name, input.name),
            ne(teams.id, input.id),
            isNull(teams.archivedAt),
          ),
        )
        .limit(1);

      if (nameConflict) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A team with this name already exists.",
        });
      }

      const [team] = await db
        .update(teams)
        .set({
          name: input.name,
          description: input.description || null,
          color: input.color,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(teams.id, input.id),
            eq(teams.organizationId, activeOrganization.id),
            isNull(teams.archivedAt),
          ),
        )
        .returning();

      if (!team) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update team.",
        });
      }

      return team;
    }),

  updateMembers: authorizedProcedure({ team: ["manage-members"] })
    .input(updateTeamMembersSchema)
    .mutation(async ({ ctx, input }) => {
      const { activeOrganization, db } = ctx;

      await assertTeamInOrganization({
        db,
        organizationId: activeOrganization.id,
        teamId: input.teamId,
      });

      const memberIds = await replaceTeamMembers({
        db,
        organizationId: activeOrganization.id,
        teamId: input.teamId,
        memberIds: input.memberIds,
      });

      await db
        .update(teams)
        .set({ updatedAt: new Date() })
        .where(eq(teams.id, input.teamId));

      return { memberIds };
    }),

  delete: authorizedProcedure({ team: ["delete"] })
    .input(deleteTeamSchema)
    .mutation(async ({ ctx, input }) => {
      const { activeOrganization, db } = ctx;

      const [team] = await db
        .delete(teams)
        .where(
          and(
            eq(teams.id, input.id),
            eq(teams.organizationId, activeOrganization.id),
          ),
        )
        .returning({ id: teams.id });

      if (!team) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Team not found.",
        });
      }

      return team;
    }),
});
