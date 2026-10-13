import { TRPCError } from "@trpc/server";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  isNotNull,
  isNull,
  lt,
  lte,
  ne,
  sql,
} from "@zentro/db/drizzle";
import {
  members,
  projects,
  taskActivityEvents,
  tasks,
  teams,
  users,
} from "@zentro/db/schema";

import {
  createTaskSchema,
  deleteTaskByKeySchema,
  getTaskByKeySchema,
  getTasksSchema,
  updateTaskByKeySchema,
} from "../../types/zod-schema";
import { moduleProcedure, router } from "../trpc";
import {
  getChangedTaskFields,
  getCurrentMember,
  getTaskForActiveOrganization,
} from "./task-helpers";

function isUniqueViolation(error: unknown) {
  const candidate = error as {
    code?: string;
    cause?: { code?: string };
  } | null;

  return candidate?.code === "23505" || candidate?.cause?.code === "23505";
}

export const taskRouter = router({
  createTask: moduleProcedure("tasks")
    .input(createTaskSchema)
    .mutation(async ({ ctx, input }) => {
      const { db, user, activeOrganization } = ctx;

      const create = () =>
        db.transaction(async (tx) => {
          // Serialize task numbering per project. The lock is released when the
          // transaction ends, so numbers stay sequential without gaps.
          await tx.execute(
            sql`select pg_advisory_xact_lock(hashtextextended(${input.projectId}, 0))`,
          );

          const [member] = await tx
            .select({ id: members.id })
            .from(members)
            .where(
              and(
                eq(members.userId, user.id),
                eq(members.organizationId, activeOrganization.id),
              ),
            )
            .limit(1);

          if (!member) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Member not found in active organization.",
            });
          }

          const [project] = await tx
            .select({
              id: projects.id,
              teamId: projects.teamId,
              taskKeyPrefix: projects.taskKeyPrefix,
            })
            .from(projects)
            .where(
              and(
                eq(projects.id, input.projectId),
                eq(projects.organizationId, activeOrganization.id),
              ),
            )
            .limit(1);

          if (!project) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Project not found.",
            });
          }

          const [latestTask] = await tx
            .select({ taskNumber: tasks.taskNumber })
            .from(tasks)
            .where(eq(tasks.projectId, project.id))
            .orderBy(desc(tasks.taskNumber))
            .limit(1);

          const taskNumber = (latestTask?.taskNumber ?? 0) + 1;
          const key = `${project.taskKeyPrefix}-${taskNumber}`;
          let assignedToMemberId: string | null = null;

          if (input.assignedToMemberId) {
            const [assignee] = await tx
              .select({ id: members.id })
              .from(members)
              .where(
                and(
                  eq(members.id, input.assignedToMemberId),
                  eq(members.organizationId, activeOrganization.id),
                ),
              )
              .limit(1);

            if (!assignee) {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "Assignee not found in active organization.",
              });
            }

            assignedToMemberId = assignee.id;
          }

          const [task] = await tx
            .insert(tasks)
            .values({
              name: input.name,
              status: input.status,
              priority: input.priority,
              dueAt: input.dueAt,
              projectId: project.id,
              teamId: project.teamId,
              description: input.description || null,
              assignedToMemberId,
              createdByMemberId: member.id,
              organizationId: activeOrganization.id,
              key,
              taskNumber,
            })
            .returning();

          if (!task) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to create task.",
            });
          }

          await tx.insert(taskActivityEvents).values({
            organizationId: activeOrganization.id,
            taskId: task.id,
            actorMemberId: member.id,
            type: "task.created",
          });

          return task;
        });

      try {
        return await create();
      } catch (error) {
        // Safety net: the advisory lock should prevent duplicate keys, but a
        // unique violation is retried once in case another writer slipped by.
        if (!isUniqueViolation(error)) {
          throw error;
        }

        return create();
      }
    }),
  getTasksByOrgId: moduleProcedure("tasks")
    .input(getTasksSchema.optional().default({}))
    .query(async ({ ctx, input }) => {
      const { db, activeOrganization } = ctx;
      const conditions = [
        eq(tasks.organizationId, activeOrganization.id),
        isNull(tasks.deletedAt),
      ];

      if (input.teamId) {
        conditions.push(eq(tasks.teamId, input.teamId));
      }

      const allTasks = await db
        .select({
          id: tasks.id,
          key: tasks.key,
          name: tasks.name,
          description: tasks.description,
          project: projects.name,
          projectSlug: projects.slug,
          teamId: tasks.teamId,
          teamName: teams.name,
          teamColor: teams.color,
          status: tasks.status,
          priority: tasks.priority,
          assignee: users.name,
          due: tasks.dueAt,
          createdAt: tasks.createdAt,
        })
        .from(tasks)
        .innerJoin(projects, eq(projects.id, tasks.projectId))
        .leftJoin(teams, eq(teams.id, tasks.teamId))
        .leftJoin(members, eq(members.id, tasks.assignedToMemberId))
        .leftJoin(users, eq(users.id, members.userId))
        .where(and(...conditions))
        .orderBy(desc(tasks.createdAt));

      return allTasks;
    }),
  getTaskByKey: moduleProcedure("tasks")
    .input(getTaskByKeySchema)
    .query(async ({ ctx, input }) => {
      const { db, activeOrganization } = ctx;
      const { key } = input;

      const [task] = await db
        .select({
          id: tasks.id,
          key: tasks.key,
          taskNumber: tasks.taskNumber,
          name: tasks.name,
          description: tasks.description,
          projectId: projects.id,
          projectName: projects.name,
          projectSlug: projects.slug,
          teamId: tasks.teamId,
          teamName: teams.name,
          teamColor: teams.color,
          status: tasks.status,
          priority: tasks.priority,
          assignedToMemberId: tasks.assignedToMemberId,
          createdByMemberId: tasks.createdByMemberId,
          assignee: users.name,
          due: tasks.dueAt,
          completedAt: tasks.completedAt,
          createdAt: tasks.createdAt,
          updatedAt: tasks.updatedAt,
        })
        .from(tasks)
        .innerJoin(projects, eq(projects.id, tasks.projectId))
        .leftJoin(teams, eq(teams.id, tasks.teamId))
        .leftJoin(members, eq(members.id, tasks.assignedToMemberId))
        .leftJoin(users, eq(users.id, members.userId))
        .where(
          and(
            eq(tasks.key, key),
            eq(tasks.organizationId, activeOrganization.id),
            isNull(tasks.deletedAt),
          ),
        )
        .limit(1);

      if (!task) {
        return task;
      }

      // The reporter is the member who created the task, if they still exist.
      const [reporter] = task.createdByMemberId
        ? await db
            .select({ name: users.name, email: users.email })
            .from(members)
            .innerJoin(users, eq(users.id, members.userId))
            .where(
              and(
                eq(members.id, task.createdByMemberId),
                eq(members.organizationId, activeOrganization.id),
              ),
            )
            .limit(1)
        : [];

      return { ...task, reporter: reporter?.name ?? reporter?.email ?? null };
    }),
  getOverview: moduleProcedure("tasks").query(async ({ ctx }) => {
    const { db, user, activeOrganization } = ctx;
    const organizationId = activeOrganization.id;
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const active = and(
      eq(tasks.organizationId, organizationId),
      isNull(tasks.deletedAt),
    );
    const open = and(active, ne(tasks.status, "done"));
    const taskColumns = {
      id: tasks.id,
      key: tasks.key,
      name: tasks.name,
      status: tasks.status,
      priority: tasks.priority,
      dueAt: tasks.dueAt,
      updatedAt: tasks.updatedAt,
      project: projects.name,
    };

    const [currentMember] = await db
      .select({ id: members.id })
      .from(members)
      .where(
        and(
          eq(members.userId, user.id),
          eq(members.organizationId, organizationId),
        ),
      )
      .limit(1);

    const [
      statusRows,
      priorityRows,
      [created],
      [updated],
      [completed],
      [dueSoon],
      assigned,
      overdue,
      recentlyUpdated,
      activity,
    ] = await Promise.all([
      db
        .select({ status: tasks.status, count: count() })
        .from(tasks)
        .where(active)
        .groupBy(tasks.status),
      db
        .select({ priority: tasks.priority, count: count() })
        .from(tasks)
        .where(active)
        .groupBy(tasks.priority),
      db
        .select({ count: count() })
        .from(tasks)
        .where(and(active, gte(tasks.createdAt, weekAgo))),
      db
        .select({ count: count() })
        .from(tasks)
        .where(and(active, gte(tasks.updatedAt, weekAgo))),
      // Completion is recorded as a status change event; tasks have no
      // completion timestamp that is kept up to date.
      db
        .select({ count: count() })
        .from(taskActivityEvents)
        .where(
          and(
            eq(taskActivityEvents.organizationId, organizationId),
            eq(taskActivityEvents.field, "status"),
            eq(taskActivityEvents.toValue, "done"),
            gte(taskActivityEvents.createdAt, weekAgo),
          ),
        ),
      db
        .select({ count: count() })
        .from(tasks)
        .where(and(open, gte(tasks.dueAt, now), lte(tasks.dueAt, weekAhead))),
      currentMember
        ? db
            .select(taskColumns)
            .from(tasks)
            .innerJoin(projects, eq(projects.id, tasks.projectId))
            .where(and(open, eq(tasks.assignedToMemberId, currentMember.id)))
            .orderBy(sql`${tasks.dueAt} asc nulls last`, desc(tasks.updatedAt))
            .limit(6)
        : Promise.resolve([]),
      db
        .select(taskColumns)
        .from(tasks)
        .innerJoin(projects, eq(projects.id, tasks.projectId))
        .where(and(open, isNotNull(tasks.dueAt), lt(tasks.dueAt, now)))
        .orderBy(asc(tasks.dueAt))
        .limit(6),
      db
        .select(taskColumns)
        .from(tasks)
        .innerJoin(projects, eq(projects.id, tasks.projectId))
        .where(active)
        .orderBy(desc(tasks.updatedAt))
        .limit(6),
      db
        .select({
          id: taskActivityEvents.id,
          type: taskActivityEvents.type,
          field: taskActivityEvents.field,
          toValue: taskActivityEvents.toValue,
          createdAt: taskActivityEvents.createdAt,
          actor: users.name,
          taskKey: tasks.key,
          taskName: tasks.name,
        })
        .from(taskActivityEvents)
        .innerJoin(tasks, eq(tasks.id, taskActivityEvents.taskId))
        .leftJoin(members, eq(members.id, taskActivityEvents.actorMemberId))
        .leftJoin(users, eq(users.id, members.userId))
        .where(
          and(
            eq(taskActivityEvents.organizationId, organizationId),
            isNull(tasks.deletedAt),
          ),
        )
        .orderBy(desc(taskActivityEvents.createdAt))
        .limit(20),
    ]);

    const [overdueCount] = await db
      .select({ count: count() })
      .from(tasks)
      .where(and(open, isNotNull(tasks.dueAt), lt(tasks.dueAt, now)));

    return {
      counts: {
        createdLast7Days: created?.count ?? 0,
        updatedLast7Days: updated?.count ?? 0,
        completedLast7Days: completed?.count ?? 0,
        dueNext7Days: dueSoon?.count ?? 0,
        overdue: overdueCount?.count ?? 0,
      },
      byStatus: statusRows,
      byPriority: priorityRows,
      assignedToMe: assigned,
      overdue,
      recentlyUpdated,
      activity,
    };
  }),
  updateTaskByKey: moduleProcedure("tasks")
    .input(updateTaskByKeySchema)
    .mutation(async ({ ctx, input }) => {
      const { db, activeOrganization } = ctx;
      const { key, ...values } = input;
      const previousTask = await getTaskForActiveOrganization(ctx, key);
      const actorMember = await getCurrentMember(ctx);

      if (values.assignedToMemberId) {
        const [assignee] = await db
          .select({ id: members.id })
          .from(members)
          .where(
            and(
              eq(members.id, values.assignedToMemberId),
              eq(members.organizationId, activeOrganization.id),
            ),
          )
          .limit(1);

        if (!assignee) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Assignee not found in active organization.",
          });
        }
      }

      const updateValues: {
        name?: string;
        description?: string | null;
        status?: string;
        priority?: string;
        assignedToMemberId?: string | null;
        dueAt?: Date | null;
        updatedAt: Date;
      } = {
        updatedAt: new Date(),
      };

      if (values.name !== undefined) {
        updateValues.name = values.name;
      }

      if (values.description !== undefined) {
        updateValues.description = values.description || null;
      }

      if (values.status !== undefined) {
        updateValues.status = values.status;
      }

      if (values.priority !== undefined) {
        updateValues.priority = values.priority;
      }

      if (values.assignedToMemberId !== undefined) {
        updateValues.assignedToMemberId = values.assignedToMemberId;
      }

      if (values.dueAt !== undefined) {
        updateValues.dueAt = values.dueAt;
      }

      const changes = getChangedTaskFields(previousTask, values);

      const [updatedTask] = await db
        .update(tasks)
        .set(updateValues)
        .where(
          and(
            eq(tasks.key, key),
            eq(tasks.organizationId, activeOrganization.id),
            isNull(tasks.deletedAt),
          ),
        )
        .returning({ id: tasks.id });

      if (!updatedTask) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Task not found.",
        });
      }

      if (changes.length) {
        await db.insert(taskActivityEvents).values(
          changes.map((change) => ({
            organizationId: activeOrganization.id,
            taskId: updatedTask.id,
            actorMemberId: actorMember.id,
            type: "task.updated",
            field: change.field,
            fromValue: change.fromValue,
            toValue: change.toValue,
          })),
        );
      }

      const [task] = await db
        .select({
          id: tasks.id,
          key: tasks.key,
          taskNumber: tasks.taskNumber,
          name: tasks.name,
          description: tasks.description,
          projectId: projects.id,
          projectName: projects.name,
          projectSlug: projects.slug,
          teamId: tasks.teamId,
          teamName: teams.name,
          teamColor: teams.color,
          status: tasks.status,
          priority: tasks.priority,
          assignedToMemberId: tasks.assignedToMemberId,
          assignee: users.name,
          due: tasks.dueAt,
          completedAt: tasks.completedAt,
          createdAt: tasks.createdAt,
          updatedAt: tasks.updatedAt,
        })
        .from(tasks)
        .innerJoin(projects, eq(projects.id, tasks.projectId))
        .leftJoin(teams, eq(teams.id, tasks.teamId))
        .leftJoin(members, eq(members.id, tasks.assignedToMemberId))
        .leftJoin(users, eq(users.id, members.userId))
        .where(eq(tasks.id, updatedTask.id))
        .limit(1);

      return task;
    }),
  deleteTaskByKey: moduleProcedure("tasks")
    .input(deleteTaskByKeySchema)
    .mutation(async ({ ctx, input }) => {
      const { db, activeOrganization } = ctx;
      const task = await getTaskForActiveOrganization(ctx, input.key);
      const actorMember = await getCurrentMember(ctx);

      const [deletedTask] = await db
        .update(tasks)
        .set({
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(tasks.id, task.id),
            eq(tasks.organizationId, activeOrganization.id),
            isNull(tasks.deletedAt),
          ),
        )
        .returning({ id: tasks.id, key: tasks.key });

      if (!deletedTask) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Task not found.",
        });
      }

      await db.insert(taskActivityEvents).values({
        organizationId: activeOrganization.id,
        taskId: task.id,
        actorMemberId: actorMember.id,
        type: "task.deleted",
      });

      return deletedTask;
    }),
});
