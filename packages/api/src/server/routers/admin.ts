import { actorName, describeEvent } from "@zentro/audit";
import { and, count, desc, eq, gt, isNull, lt, sql } from "@zentro/db/drizzle";
import {
  activityEvents,
  docs,
  files,
  invitations,
  members,
  organizations,
  projects,
  tasks,
  teams,
  users,
} from "@zentro/db/schema";

import { permissionProcedure, router } from "../trpc";

const procedure = (permission: string) =>
  permissionProcedure(permission, undefined, { module: "admin" });

const day = 864e5;

export const adminRouter = router({
  /** Setup progress, seat and storage totals, and the latest admin actions. */
  overview: procedure("admin.view").query(async ({ ctx }) => {
    const organizationId = ctx.activeOrganization.id;
    const one = async <T>(query: Promise<T[]>) => (await query)[0];

    const [organization, memberRow, teamRow, projectRow, invitationRow] =
      await Promise.all([
        one(
          ctx.db
            .select({ logo: organizations.logo })
            .from(organizations)
            .where(eq(organizations.id, organizationId)),
        ),
        one(
          ctx.db
            .select({ value: count() })
            .from(members)
            .where(eq(members.organizationId, organizationId)),
        ),
        one(
          ctx.db
            .select({ value: count() })
            .from(teams)
            .where(eq(teams.organizationId, organizationId)),
        ),
        one(
          ctx.db
            .select({ value: count() })
            .from(projects)
            .where(eq(projects.organizationId, organizationId)),
        ),
        one(
          ctx.db
            .select({ value: count() })
            .from(invitations)
            .where(
              and(
                eq(invitations.organizationId, organizationId),
                eq(invitations.status, "pending"),
              ),
            ),
        ),
      ]);

    const [storage] = await ctx.db
      .select({
        bytes: sql<number>`coalesce(sum(${files.size}), 0)::bigint`.mapWith(
          Number,
        ),
        files: count(),
      })
      .from(files)
      .where(
        and(eq(files.organizationId, organizationId), isNull(files.deletedAt)),
      );

    const recent = await ctx.db
      .select({ event: activityEvents, name: users.name, email: users.email })
      .from(activityEvents)
      .leftJoin(users, eq(users.id, activityEvents.actorUserId))
      .where(eq(activityEvents.organizationId, organizationId))
      .orderBy(desc(activityEvents.createdAt))
      .limit(8);

    const memberCount = memberRow?.value ?? 0;
    const teamCount = teamRow?.value ?? 0;
    const projectCount = projectRow?.value ?? 0;
    const pendingInvites = invitationRow?.value ?? 0;

    return {
      members: memberCount,
      pendingInvites,
      teams: teamCount,
      projects: projectCount,
      storageBytes: storage?.bytes ?? 0,
      fileCount: storage?.files ?? 0,
      setup: [
        {
          id: "logo",
          label: "Add an organization logo",
          done: Boolean(organization?.logo),
          href: "/settings/organization/general",
        },
        {
          id: "people",
          label: "Invite your team",
          done: memberCount > 1 || pendingInvites > 0,
          href: "/settings/organization/invitations",
        },
        {
          id: "teams",
          label: "Create a team",
          done: teamCount > 0,
          href: "/settings/organization/teams",
        },
        {
          id: "projects",
          label: "Start a project",
          done: projectCount > 0,
          href: "/projects",
        },
      ],
      recent: recent.map(({ event, name, email }) => ({
        id: event.id,
        text: describeEvent(
          event,
          actorName(name || email ? { name, email } : null, event.actorUserId),
        ),
        at: event.createdAt.toISOString(),
      })),
    };
  }),

  /** What the organization stores and who adds the most. */
  usage: procedure("admin.view").query(async ({ ctx }) => {
    const organizationId = ctx.activeOrganization.id;

    const perUploader = await ctx.db
      .select({
        name: users.name,
        bytes: sql<number>`coalesce(sum(${files.size}), 0)::bigint`.mapWith(
          Number,
        ),
        files: count(),
      })
      .from(files)
      .leftJoin(members, eq(members.id, files.uploadedByMemberId))
      .leftJoin(users, eq(users.id, members.userId))
      .where(
        and(eq(files.organizationId, organizationId), isNull(files.deletedAt)),
      )
      .groupBy(users.name)
      .orderBy(desc(sql`sum(${files.size})`))
      .limit(10);

    const [taskRow] = await ctx.db
      .select({ value: count() })
      .from(tasks)
      .where(
        and(eq(tasks.organizationId, organizationId), isNull(tasks.deletedAt)),
      );
    const [docRow] = await ctx.db
      .select({ value: count() })
      .from(docs)
      .where(eq(docs.organizationId, organizationId));

    return {
      tasks: taskRow?.value ?? 0,
      docs: docRow?.value ?? 0,
      uploaders: perUploader.map((row) => ({
        name: row.name ?? "Former member",
        bytes: row.bytes,
        files: row.files,
      })),
    };
  }),

  /** Who holds the keys, which invitations linger, and recent failed sign-ins. */
  security: procedure("admin.view").query(async ({ ctx }) => {
    const organizationId = ctx.activeOrganization.id;

    const privileged = await ctx.db
      .select({
        id: members.id,
        name: users.name,
        email: users.email,
        role: members.role,
        emailVerified: users.emailVerified,
      })
      .from(members)
      .innerJoin(users, eq(users.id, members.userId))
      .where(
        and(
          eq(members.organizationId, organizationId),
          sql`${members.role} in ('owner', 'admin')`,
        ),
      );

    const stale = await ctx.db
      .select({
        id: invitations.id,
        email: invitations.email,
        role: invitations.role,
        createdAt: invitations.createdAt,
      })
      .from(invitations)
      .where(
        and(
          eq(invitations.organizationId, organizationId),
          eq(invitations.status, "pending"),
          lt(invitations.createdAt, new Date(Date.now() - 7 * day)),
        ),
      )
      .orderBy(invitations.createdAt);

    const [failed] = await ctx.db
      .select({ value: count() })
      .from(activityEvents)
      .where(
        and(
          eq(activityEvents.organizationId, organizationId),
          eq(activityEvents.action, "auth.sign_in_failed"),
          gt(activityEvents.createdAt, new Date(Date.now() - 7 * day)),
        ),
      );

    return {
      privileged: privileged.map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        verified: Boolean(row.emailVerified),
      })),
      staleInvitations: stale.map((row) => ({
        id: row.id,
        email: row.email,
        role: row.role,
        createdAt: row.createdAt.toISOString(),
      })),
      failedSignIns: failed?.value ?? 0,
    };
  }),
});
