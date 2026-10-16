import { TRPCError } from "@trpc/server";
import {
  and,
  asc,
  desc,
  eq,
  inArray,
  isNull,
  ne,
  or,
} from "@zentro/db/drizzle";
import {
  members,
  projects,
  tasks,
  teamMembers,
  teams,
  users,
} from "@zentro/db/schema";

import {
  createTeamSchema,
  deleteTeamSchema,
  getTeamByIdSchema,
  updateTeamMembersSchema,
  updateTeamSchema,
} from "../../types/zod-schema";
import {
  denialFor,
  listProcedure,
  permissionProcedure,
  protectedProcedure,
  router,
} from "../trpc";
import { assignCreatorLeadRole } from "../access";
import { buildChanges } from "@zentro/audit";
import { teamById } from "../resources";

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
    .select({
      id: teams.id,
      name: teams.name,
      description: teams.description,
      color: teams.color,
    })
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
  // Everyone who can view teams organization-wide sees all of them. A role
  // given on a single team shows only that team.
  getAll: listProcedure("teams.view").query(async ({ ctx }) => {
    const { activeOrganization, db } = ctx;
    const everywhere = await ctx.permissions.can("teams.view");
    const visibleTeamIds = everywhere
      ? null
      : await ctx.permissions.teamIdsWith("teams.view");

    if (visibleTeamIds && !visibleTeamIds.length) {
      throw denialFor({ allowed: false, reasons: [] });
    }

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
          visibleTeamIds ? inArray(teams.id, visibleTeamIds) : undefined,
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

  getById: permissionProcedure("teams.view", teamById("id"))
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

  // The people a team can be given: needed to view teams, or by a team lead
  // who adds people to their own team.
  getAvailableMembers: protectedProcedure
    .meta({ permissions: ["teams.view", "teams.members.manage"] })
    .query(async ({ ctx }) => {
      const { activeOrganization, db } = ctx;

      if (
        !(await ctx.permissions.can("teams.view")) &&
        !(await ctx.permissions.teamIdsWith("teams.members.manage")).length
      ) {
        throw denialFor({ allowed: false, reasons: [] });
      }

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

  create: permissionProcedure("teams.create", undefined, {
    audit: ["team.created"],
  })
    .input(createTeamSchema)
    .mutation(async ({ ctx, input }) => {
      const { activeOrganization, db, user } = ctx;

      const created = await db.transaction(async (tx) => {
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

        await ctx.audit.record(tx, {
          action: "team.created",
          target: { id: team.id, label: team.name },
          teamId: team.id,
          metadata: { memberCount: new Set(input.memberIds).size },
        });

        // Whoever creates a team leads it.
        await assignCreatorLeadRole(tx, ctx.audit, {
          organizationId: activeOrganization.id,
          userId: user.id,
          systemKey: "team_lead",
          scopeType: "team",
          scopeId: team.id,
          scopeName: team.name,
        });

        return team;
      });

      return created;
    }),

  update: permissionProcedure("teams.update", teamById("id"), {
    audit: ["team.updated"],
  })
    .input(updateTeamSchema)
    .mutation(async ({ ctx, input }) => {
      const { activeOrganization, db } = ctx;

      const previous = await assertTeamInOrganization({
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

      const team = await db.transaction(async (tx) => {
        const [row] = await tx
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

        if (!row) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to update team.",
          });
        }

        const changes = buildChanges(
          {
            name: previous.name,
            description: previous.description,
            color: previous.color,
          },
          {
            name: row.name,
            description: row.description,
            color: row.color,
          },
        );

        if (changes.length) {
          await ctx.audit.record(tx, {
            action: "team.updated",
            target: { id: row.id, label: row.name },
            teamId: row.id,
            changes,
          });
        } else {
          ctx.audit.skipped("team.updated");
        }

        return row;
      });

      return team;
    }),

  updateMembers: permissionProcedure(
    "teams.members.manage",
    teamById("teamId"),
    {
      audit: ["team.member_added", "team.member_removed"],
    },
  )
    .input(updateTeamMembersSchema)
    .mutation(async ({ ctx, input }) => {
      const { activeOrganization, db } = ctx;

      const team = await assertTeamInOrganization({
        db,
        organizationId: activeOrganization.id,
        teamId: input.teamId,
      });

      return db.transaction(async (tx) => {
        const before = new Set(
          (
            await tx
              .select({ memberId: teamMembers.memberId })
              .from(teamMembers)
              .where(eq(teamMembers.teamId, input.teamId))
          ).map((row) => row.memberId),
        );

        const memberIds = await replaceTeamMembers({
          db: tx,
          organizationId: activeOrganization.id,
          teamId: input.teamId,
          memberIds: input.memberIds,
        });

        await tx
          .update(teams)
          .set({ updatedAt: new Date() })
          .where(eq(teams.id, input.teamId));

        const after = new Set(memberIds);
        const added = memberIds.filter((id) => !before.has(id));
        const removed = [...before].filter((id) => !after.has(id));
        const changed = [...added, ...removed];
        const people = changed.length
          ? await tx
              .select({
                memberId: members.id,
                userId: members.userId,
                name: users.name,
                email: users.email,
              })
              .from(members)
              .innerJoin(users, eq(users.id, members.userId))
              .where(inArray(members.id, changed))
          : [];

        for (const [action, ids] of [
          ["team.member_added", added],
          ["team.member_removed", removed],
        ] as const) {
          for (const id of ids) {
            const person = people.find((item) => item.memberId === id);

            await ctx.audit.record(tx, {
              action,
              target: { id: team.id, label: team.name },
              teamId: team.id,
              metadata: {
                memberId: id,
                userId: person?.userId,
                name: person?.name || person?.email,
              },
            });
          }
        }

        if (!changed.length) {
          ctx.audit.skipped("team.member_added");
        }

        return { memberIds };
      });
    }),

  delete: permissionProcedure("teams.delete", teamById("id"), {
    audit: ["team.deleted"],
  })
    .input(deleteTeamSchema)
    .mutation(async ({ ctx, input }) => {
      const { activeOrganization, db } = ctx;

      return db.transaction(async (tx) => {
        const [team] = await tx
          .delete(teams)
          .where(
            and(
              eq(teams.id, input.id),
              eq(teams.organizationId, activeOrganization.id),
            ),
          )
          .returning({ id: teams.id, name: teams.name });

        if (!team) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Team not found.",
          });
        }

        await ctx.audit.record(tx, {
          action: "team.deleted",
          target: { id: team.id, label: team.name },
          teamId: team.id,
        });

        return { id: team.id };
      });
    }),

  getTeamWorkload: permissionProcedure("teams.view", teamById("id"))
    .input(getTeamByIdSchema)
    .query(async ({ ctx, input }) => {
      const { db, activeOrganization } = ctx;

      const [team] = await db
        .select({ id: teams.id, name: teams.name })
        .from(teams)
        .where(
          and(
            eq(teams.id, input.id),
            eq(teams.organizationId, activeOrganization.id),
          ),
        )
        .limit(1);

      if (!team) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Team not found.",
        });
      }

      // Team members
      const teamMemberList = await db
        .select({
          memberId: members.id,
          userId: users.id,
          name: users.name,
          email: users.email,
        })
        .from(teamMembers)
        .innerJoin(members, eq(members.id, teamMembers.memberId))
        .innerJoin(users, eq(users.id, members.userId))
        .where(eq(teamMembers.teamId, input.id));

      const memberIds = teamMemberList.map((m) => m.memberId);

      // Tasks either owned by this team, or assigned to a member of this team across any project
      const teamTasks = await db
        .select({
          id: tasks.id,
          key: tasks.key,
          name: tasks.name,
          status: tasks.status,
          priority: tasks.priority,
          estimatePoints: tasks.estimatePoints,
          dueAt: tasks.dueAt,
          projectId: projects.id,
          projectName: projects.name,
          projectSlug: projects.slug,
          assignedToMemberId: tasks.assignedToMemberId,
          assigneeName: users.name,
          createdAt: tasks.createdAt,
        })
        .from(tasks)
        .innerJoin(projects, eq(projects.id, tasks.projectId))
        .leftJoin(members, eq(members.id, tasks.assignedToMemberId))
        .leftJoin(users, eq(users.id, members.userId))
        .where(
          and(
            eq(tasks.organizationId, activeOrganization.id),
            isNull(tasks.deletedAt),
            memberIds.length
              ? or(
                  eq(tasks.teamId, input.id),
                  inArray(tasks.assignedToMemberId, memberIds),
                )
              : eq(tasks.teamId, input.id),
          ),
        )
        .orderBy(desc(tasks.createdAt));

      const now = new Date();
      const openTasks = teamTasks.filter((t) => t.status !== "done");

      // Per-member capacity breakdown
      const memberWorkload = teamMemberList.map((member) => {
        const assigned = openTasks.filter(
          (t) => t.assignedToMemberId === member.memberId,
        );
        const inProgress = assigned.filter(
          (t) => t.status === "in-progress",
        ).length;
        const overdue = assigned.filter(
          (t) => t.dueAt && new Date(t.dueAt).getTime() < now.getTime(),
        ).length;
        const totalPoints = assigned.reduce(
          (sum, t) => sum + (t.estimatePoints ?? 0),
          0,
        );
        const utilizationPercent = Math.min(
          200,
          Math.round((assigned.length / 5) * 100),
        );
        const isOverloaded = assigned.length > 5 || overdue > 1;
        const isUnderutilized = assigned.length <= 1;

        return {
          memberId: member.memberId,
          userId: member.userId,
          name: member.name || member.email,
          openCount: assigned.length,
          inProgressCount: inProgress,
          overdueCount: overdue,
          totalPoints,
          utilizationPercent,
          isOverloaded,
          isUnderutilized,
        };
      });

      return {
        team,
        totalTasks: teamTasks.length,
        openTasksCount: openTasks.length,
        doneTasksCount: teamTasks.length - openTasks.length,
        memberWorkload,
        tasks: teamTasks.slice(0, 100),
      };
    }),
});
