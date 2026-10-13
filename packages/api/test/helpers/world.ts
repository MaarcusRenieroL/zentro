import { randomUUID } from "node:crypto";

import { db } from "@zentro/db";
import { eq, inArray } from "@zentro/db/drizzle";
import {
  docs,
  invitations,
  members,
  organizationModules,
  organizations,
  projects,
  taskActivityEvents,
  taskComments,
  tasks,
  teamMembers,
  teams,
  users,
} from "@zentro/db/schema";

import { appRouter } from "../../src/server/root";
import { loadEnabledModules } from "../../src/server/modules";
import type { TRPCContext } from "../../src/types";

export type Role = "owner" | "admin" | "member";

export type TestUser = typeof users.$inferSelect;
export type TestOrg = typeof organizations.$inferSelect;
export type TestMember = typeof members.$inferSelect;

const suffix = () => randomUUID().slice(0, 8);

/**
 * Creates rows directly through Drizzle and removes everything it created in
 * `cleanup()`. Deleting users and organizations cascades to the rest, so test
 * files stay independent even though they share one database.
 */
export class World {
  private userIds: string[] = [];
  private orgIds: string[] = [];

  async user(name = "Test User"): Promise<TestUser> {
    const id = randomUUID();
    const [user] = await db
      .insert(users)
      .values({
        id,
        name,
        email: `${id}@example.test`,
        emailVerified: true,
      })
      .returning();

    this.userIds.push(id);

    return user!;
  }

  async org(name = "Test Org"): Promise<TestOrg> {
    const [org] = await db
      .insert(organizations)
      .values({ name, slug: `org-${suffix()}` })
      .returning();

    this.orgIds.push(org!.id);

    return org!;
  }

  async member(
    org: TestOrg,
    user: TestUser,
    role: Role = "member",
  ): Promise<TestMember> {
    const [member] = await db
      .insert(members)
      .values({ organizationId: org.id, userId: user.id, role })
      .returning();

    return member!;
  }

  /** A user that is a member of `org` with the given role. */
  async userIn(org: TestOrg, role: Role, name = `${role} user`) {
    const user = await this.user(name);
    const member = await this.member(org, user, role);

    return { user, member };
  }

  async project(
    org: TestOrg,
    values: Partial<typeof projects.$inferInsert> = {},
  ) {
    const key = suffix();
    const [project] = await db
      .insert(projects)
      .values({
        organizationId: org.id,
        name: `Project ${key}`,
        slug: `project-${key}`,
        taskKeyPrefix: "PA",
        ...values,
      })
      .returning();

    return project!;
  }

  async task(
    org: TestOrg,
    project: typeof projects.$inferSelect,
    values: Partial<typeof tasks.$inferInsert> = {},
  ) {
    const taskNumber = values.taskNumber ?? 1;
    const [task] = await db
      .insert(tasks)
      .values({
        organizationId: org.id,
        projectId: project.id,
        name: "Task",
        taskNumber,
        key: `${project.taskKeyPrefix}-${taskNumber}`,
        ...values,
      })
      .returning();

    return task!;
  }

  async doc(org: TestOrg, values: Partial<typeof docs.$inferInsert> = {}) {
    const key = suffix();
    const [doc] = await db
      .insert(docs)
      .values({
        organizationId: org.id,
        title: `Doc ${key}`,
        slug: `doc-${key}`,
        content: "",
        ...values,
      })
      .returning();

    return doc!;
  }

  async team(org: TestOrg, values: Partial<typeof teams.$inferInsert> = {}) {
    const [team] = await db
      .insert(teams)
      .values({ organizationId: org.id, name: `Team ${suffix()}`, ...values })
      .returning();

    return team!;
  }

  async setModule(org: TestOrg, moduleId: string, enabled: boolean) {
    await db
      .insert(organizationModules)
      .values({ organizationId: org.id, moduleId, enabled })
      .onConflictDoUpdate({
        target: [
          organizationModules.organizationId,
          organizationModules.moduleId,
        ],
        set: { enabled },
      });
  }

  /**
   * A tRPC caller as the app builds it for a request: the session user plus
   * the active organization, whose `members` list comes back in whatever order
   * the member table returned it (Better Auth's `getFullOrganization`).
   */
  async caller(
    user: TestUser,
    org: TestOrg,
    options: { memberOrder?: "asc" | "desc" } = {},
  ) {
    const rows = await db
      .select({ member: members, user: users })
      .from(members)
      .innerJoin(users, eq(users.id, members.userId))
      .where(eq(members.organizationId, org.id));

    rows.sort((a, b) => {
      const diff = a.member.id.localeCompare(b.member.id);

      return options.memberOrder === "desc" ? -diff : diff;
    });

    const activeOrganization = {
      ...org,
      members: rows.map(({ member, user: memberUser }) => ({
        ...member,
        user: memberUser,
      })),
      invitations: [],
    };

    return appRouter.createCaller({
      db,
      session: {
        session: {
          id: randomUUID(),
          token: randomUUID(),
          userId: user.id,
          activeOrganizationId: org.id,
          expiresAt: new Date(Date.now() + 60_000),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        user,
      },
      user,
      activeOrganization,
      enabledModules: () => loadEnabledModules(db, org.id),
    } as unknown as TRPCContext);
  }

  anonymousCaller() {
    return anonymousCaller();
  }

  /** A signed-in caller who has no active organization (a brand new user). */
  sessionCaller(user: TestUser) {
    return appRouter.createCaller({
      db,
      session: {
        session: {
          id: randomUUID(),
          token: randomUUID(),
          userId: user.id,
          activeOrganizationId: null,
          expiresAt: new Date(Date.now() + 60_000),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        user,
      },
      user,
      activeOrganization: null,
      enabledModules: async () => new Set(),
    } as unknown as TRPCContext);
  }

  async invitation(
    org: TestOrg,
    inviter: TestUser,
    values: Partial<typeof invitations.$inferInsert> & { email: string },
  ) {
    const [invitation] = await db
      .insert(invitations)
      .values({
        organizationId: org.id,
        inviterId: inviter.id,
        role: "member",
        status: "pending",
        expiresAt: new Date(Date.now() + 86_400_000),
        ...values,
      })
      .returning();

    return invitation!;
  }

  async cleanup() {
    // Task rows reference members without cascade guarantees in every path, so
    // clear the dependents first, then let organization/user cascades finish.
    if (this.orgIds.length) {
      const orgTasks = db
        .select({ id: tasks.id })
        .from(tasks)
        .where(inArray(tasks.organizationId, this.orgIds));

      await db
        .delete(taskActivityEvents)
        .where(inArray(taskActivityEvents.taskId, orgTasks));
      await db
        .delete(taskComments)
        .where(inArray(taskComments.taskId, orgTasks));
      await db
        .delete(teamMembers)
        .where(inArray(teamMembers.organizationId, this.orgIds));
      await db
        .delete(organizations)
        .where(inArray(organizations.id, this.orgIds));
    }

    if (this.userIds.length) {
      await db.delete(users).where(inArray(users.id, this.userIds));
    }

    this.orgIds = [];
    this.userIds = [];
  }
}

export function anonymousCaller() {
  return appRouter.createCaller({
    db,
    session: null,
    user: null,
    activeOrganization: null,
    enabledModules: async () => new Set(),
  } as unknown as TRPCContext);
}
