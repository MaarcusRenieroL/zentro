import { TRPCError } from "@trpc/server";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  inArray,
  isNotNull,
  isNull,
  lt,
  lte,
  ne,
  sql,
} from "@zentro/db/drizzle";
import {
  activityEvents,
  members,
  projects,
  tasks,
  taskTimeLogs,
  teams,
  users,
  workLinks,
} from "@zentro/db/schema";

import {
  createSubtaskSchema,
  createTaskSchema,
  deleteTaskByKeySchema,
  getTaskByKeySchema,
  getTasksSchema,
  logTaskTimeSchema,
  updateTaskByKeySchema,
} from "../../types/zod-schema";
import {
  assertAnyPermission,
  denialFor,
  listProcedure,
  moduleProcedure,
  permissionProcedure,
  router,
} from "../trpc";
import { syncMentions } from "../mentions";
import { resolveTarget } from "./link";
import { loadProjectById, projectFromInput, taskByKey } from "../resources";
import {
  getChangedTaskFields,
  getCurrentMember,
  getTaskForActiveOrganization,
  recordTaskChanges,
  triggerDownstreamUnblocks,
} from "./task-helpers";

function isUniqueViolation(error: unknown) {
  const candidate = error as {
    code?: string;
    cause?: { code?: string };
  } | null;

  return candidate?.code === "23505" || candidate?.cause?.code === "23505";
}

export const taskRouter = router({
  createTask: permissionProcedure("tasks.create", projectFromInput, {
    module: "tasks",
    also: ["tasks.assign", "docs.view"],
    audit: ["task.created"],
  })
    .input(createTaskSchema)
    .mutation(async ({ ctx, input }) => {
      const { db, user, activeOrganization } = ctx;

      if (input.assignedToMemberId) {
        await assertAnyPermission(ctx, ["tasks.assign"], {
          project: (await loadProjectById(ctx, input.projectId)) ?? null,
        });
      }

      // Created from a doc: the doc must be one the caller can see.
      const linkDoc = input.linkDocId
        ? await resolveTarget(ctx, { type: "doc", id: input.linkDocId })
        : null;

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
              estimatePoints: input.estimatePoints ?? null,
              projectId: project.id,
              parentTaskId: input.parentTaskId ?? null,
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

          await ctx.audit.record(tx, {
            action: "task.created",
            target: { id: task.id, label: task.key },
            projectId: project.id,
            teamId: project.teamId,
            metadata: {
              name: task.name,
              ...(assignedToMemberId ? { assignedToMemberId } : {}),
              ...(linkDoc ? { linkedTo: linkDoc.label } : {}),
            },
          });

          if (linkDoc) {
            await tx.insert(workLinks).values({
              organizationId: activeOrganization.id,
              sourceType: "doc",
              sourceId: linkDoc.id,
              targetType: "task",
              targetId: task.id,
              kind: "relates",
              createdByMemberId: member.id,
            });
          }
          await syncMentions(tx, {
            organizationId: activeOrganization.id,
            memberId: member.id,
            source: { type: "task", id: task.id },
            text: task.description,
            via: "description",
            mode: "replace",
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
  getTasksByOrgId: listProcedure("tasks.view", "tasks")
    .input(getTasksSchema.optional().default({}))
    .query(async ({ ctx, input }) => {
      const { db, activeOrganization } = ctx;
      const viewableProjectIds =
        await ctx.permissions.viewableProjectIds("tasks.view");

      if (!viewableProjectIds.length) {
        return [];
      }

      const conditions = [
        eq(tasks.organizationId, activeOrganization.id),
        isNull(tasks.deletedAt),
        inArray(tasks.projectId, viewableProjectIds),
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
          assigneeUserId: users.id,
          due: tasks.dueAt,
          parentTaskId: tasks.parentTaskId,
          estimatePoints: tasks.estimatePoints,
          timeSpentMinutes: tasks.timeSpentMinutes,
          createdAt: tasks.createdAt,
        })
        .from(tasks)
        .innerJoin(projects, eq(projects.id, tasks.projectId))
        .leftJoin(teams, eq(teams.id, tasks.teamId))
        .leftJoin(members, eq(members.id, tasks.assignedToMemberId))
        .leftJoin(users, eq(users.id, members.userId))
        .where(and(...conditions))
        .orderBy(desc(tasks.createdAt));

      // Open tasks that block each listed task, by key. Blockers the caller
      // cannot see are left out, like everything else here.
      const ids = allTasks.map((task) => task.id);
      const [blockers, subtaskCounts] = await Promise.all([
        ids.length
          ? db
              .select({ targetId: workLinks.targetId, key: tasks.key })
              .from(workLinks)
              .innerJoin(tasks, eq(tasks.id, workLinks.sourceId))
              .where(
                and(
                  eq(workLinks.organizationId, activeOrganization.id),
                  eq(workLinks.kind, "blocks"),
                  eq(workLinks.sourceType, "task"),
                  eq(workLinks.targetType, "task"),
                  inArray(workLinks.targetId, ids),
                  ne(tasks.status, "done"),
                  isNull(tasks.deletedAt),
                  inArray(tasks.projectId, viewableProjectIds),
                ),
              )
          : [],
        ids.length
          ? db
              .select({
                parentTaskId: tasks.parentTaskId,
                total: count(),
                done: sql<number>`count(*) filter (where ${tasks.status} = 'done')`,
              })
              .from(tasks)
              .where(
                and(
                  eq(tasks.organizationId, activeOrganization.id),
                  inArray(tasks.parentTaskId, ids),
                  isNull(tasks.deletedAt),
                ),
              )
              .groupBy(tasks.parentTaskId)
          : [],
      ]);

      return allTasks.map((task) => {
        const sc = subtaskCounts.find((row) => row.parentTaskId === task.id);

        return {
          ...task,
          subtaskCount: sc
            ? { total: Number(sc.total), done: Number(sc.done) }
            : null,
          blockedBy: blockers
            .filter((row) => row.targetId === task.id)
            .map((row) => row.key),
        };
      });
    }),
  // An unknown key resolves to nothing. A task the caller may not see answers
  // the same way, so keys cannot be probed to learn what exists.
  getTaskByKey: moduleProcedure("tasks")
    .meta({ permissions: ["tasks.view"] })
    .input(getTaskByKeySchema)
    .query(async ({ ctx, input }) => {
      const { db, activeOrganization } = ctx;
      const { key } = input;
      const decision = await ctx.permissions.check(
        "tasks.view",
        await taskByKey("key")({ ctx, input }),
      );

      if (!decision.allowed) {
        const denial = denialFor(decision);

        if (denial.code === "NOT_FOUND") {
          return undefined;
        }

        throw denial;
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
          parentTaskId: tasks.parentTaskId,
          estimatePoints: tasks.estimatePoints,
          timeSpentMinutes: tasks.timeSpentMinutes,
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
      const [reporter, subtasks, parentTask, timeLogs] = await Promise.all([
        task.createdByMemberId
          ? db
              .select({
                name: users.name,
                email: users.email,
                userId: members.userId,
              })
              .from(members)
              .innerJoin(users, eq(users.id, members.userId))
              .where(
                and(
                  eq(members.id, task.createdByMemberId),
                  eq(members.organizationId, activeOrganization.id),
                ),
              )
              .limit(1)
              .then(([r]) => r ?? null)
          : Promise.resolve(null),
        db
          .select({
            id: tasks.id,
            key: tasks.key,
            taskNumber: tasks.taskNumber,
            name: tasks.name,
            status: tasks.status,
            priority: tasks.priority,
            assignee: users.name,
            due: tasks.dueAt,
            createdAt: tasks.createdAt,
          })
          .from(tasks)
          .leftJoin(members, eq(members.id, tasks.assignedToMemberId))
          .leftJoin(users, eq(users.id, members.userId))
          .where(
            and(
              eq(tasks.parentTaskId, task.id),
              eq(tasks.organizationId, activeOrganization.id),
              isNull(tasks.deletedAt),
            ),
          )
          .orderBy(asc(tasks.taskNumber)),
        task.parentTaskId
          ? db
              .select({
                id: tasks.id,
                key: tasks.key,
                name: tasks.name,
              })
              .from(tasks)
              .where(
                and(
                  eq(tasks.id, task.parentTaskId),
                  eq(tasks.organizationId, activeOrganization.id),
                  isNull(tasks.deletedAt),
                ),
              )
              .limit(1)
              .then(([p]) => p ?? null)
          : Promise.resolve(null),
        db
          .select({
            id: taskTimeLogs.id,
            durationMinutes: taskTimeLogs.durationMinutes,
            note: taskTimeLogs.note,
            createdAt: taskTimeLogs.createdAt,
            userName: users.name,
          })
          .from(taskTimeLogs)
          .leftJoin(members, eq(members.id, taskTimeLogs.memberId))
          .leftJoin(users, eq(users.id, members.userId))
          .where(eq(taskTimeLogs.taskId, task.id))
          .orderBy(desc(taskTimeLogs.createdAt)),
      ]);

      return {
        ...task,
        reporter: reporter?.name ?? reporter?.email ?? null,
        // Who created the task, so `_own` permissions can be applied on screen.
        createdByUserId: reporter?.userId ?? null,
        subtasks,
        parentTask,
        timeLogs,
      };
    }),
  createSubtask: moduleProcedure("tasks")
    .meta({ permissions: ["tasks.create"] })
    .input(createSubtaskSchema)
    .mutation(async ({ ctx, input }) => {
      const { db, activeOrganization, user } = ctx;
      const parentTask = await getTaskForActiveOrganization(
        ctx,
        input.parentTaskKey,
      );

      await assertAnyPermission(ctx, ["tasks.create"], {
        project: (await loadProjectById(ctx, parentTask.projectId)) ?? null,
      });

      const [member] = await db
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

      const [project] = await db
        .select({
          id: projects.id,
          taskKeyPrefix: projects.taskKeyPrefix,
        })
        .from(projects)
        .where(
          and(
            eq(projects.id, parentTask.projectId),
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

      return await db.transaction(async (tx) => {
        await tx.execute(
          sql`select pg_advisory_xact_lock(hashtextextended(${parentTask.projectId}, 0))`,
        );

        const [latestTask] = await tx
          .select({ taskNumber: tasks.taskNumber })
          .from(tasks)
          .where(eq(tasks.projectId, parentTask.projectId))
          .orderBy(desc(tasks.taskNumber))
          .limit(1);

        const taskNumber = (latestTask?.taskNumber ?? 0) + 1;
        const key = `${project.taskKeyPrefix}-${taskNumber}`;

        const [subtask] = await tx
          .insert(tasks)
          .values({
            organizationId: activeOrganization.id,
            projectId: parentTask.projectId,
            parentTaskId: parentTask.id,
            teamId: parentTask.teamId,
            key,
            taskNumber,
            name: input.name,
            status: "todo",
            priority: "medium",
            createdByMemberId: member.id,
            assignedToMemberId: input.assignedToMemberId ?? null,
          })
          .returning();

        if (!subtask) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create subtask.",
          });
        }

        await ctx.audit.record(tx, {
          action: "task.created",
          target: { id: subtask.id, label: subtask.key },
          projectId: subtask.projectId,
          teamId: subtask.teamId,
          metadata: {
            name: subtask.name,
            parentTaskId: parentTask.id,
            parentTaskKey: parentTask.key,
          },
        });

        return subtask;
      });
    }),
  getOverview: listProcedure("tasks.view", "tasks").query(async ({ ctx }) => {
    const { db, user, activeOrganization } = ctx;
    const organizationId = activeOrganization.id;
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const viewableProjectIds =
      await ctx.permissions.viewableProjectIds("tasks.view");

    if (!viewableProjectIds.length) {
      return {
        counts: {
          createdLast7Days: 0,
          updatedLast7Days: 0,
          completedLast7Days: 0,
          dueNext7Days: 0,
          overdue: 0,
        },
        byStatus: [] as { status: string; count: number }[],
        byPriority: [] as { priority: string; count: number }[],
        assignedToMe: [],
        overdue: [],
        recentlyUpdated: [],
        activity: [],
      };
    }

    const active = and(
      eq(tasks.organizationId, organizationId),
      isNull(tasks.deletedAt),
      inArray(tasks.projectId, viewableProjectIds),
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
        .from(activityEvents)
        .innerJoin(tasks, eq(sql`${tasks.id}::text`, activityEvents.targetId))
        .where(
          and(
            active,
            eq(activityEvents.organizationId, organizationId),
            eq(activityEvents.action, "task.status_changed"),
            sql`${activityEvents.metadata}->'changes'->0->>'to' = 'done'`,
            gte(activityEvents.createdAt, weekAgo),
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
          id: activityEvents.id,
          action: activityEvents.action,
          metadata: activityEvents.metadata,
          createdAt: activityEvents.createdAt,
          actor: users.name,
          taskKey: tasks.key,
          taskName: tasks.name,
        })
        .from(activityEvents)
        .innerJoin(tasks, eq(sql`${tasks.id}::text`, activityEvents.targetId))
        .leftJoin(users, eq(users.id, activityEvents.actorUserId))
        .where(
          and(
            eq(activityEvents.organizationId, organizationId),
            eq(activityEvents.targetType, "task"),
            eq(activityEvents.auditOnly, false),
            isNull(tasks.deletedAt),
            inArray(tasks.projectId, viewableProjectIds),
          ),
        )
        .orderBy(desc(activityEvents.createdAt), desc(activityEvents.id))
        .limit(20)
        .then((rows) =>
          rows.map((row) => {
            const change = (
              row.metadata?.changes as
                | Array<{ field: string; to: string | null }>
                | undefined
            )?.[0];

            return {
              id: row.id,
              // The shape the overview has always had.
              type:
                row.action === "task.comment_added"
                  ? "comment.created"
                  : row.action === "task.created" ||
                      row.action === "task.deleted"
                    ? row.action
                    : "task.updated",
              field: change?.field ?? null,
              toValue: change?.to ?? null,
              createdAt: row.createdAt,
              actor: row.actor,
              taskKey: row.taskKey,
              taskName: row.taskName,
            };
          }),
        ),
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
  updateTaskByKey: permissionProcedure("tasks.update_own", taskByKey("key"), {
    module: "tasks",
    also: ["tasks.assign"],
    audit: [
      "task.updated",
      "task.status_changed",
      "task.assigned",
      "task.unblocked",
    ],
  })
    .input(updateTaskByKeySchema)
    .mutation(async ({ ctx, input }) => {
      const { db, activeOrganization } = ctx;
      const { key, ...values } = input;
      const previousTask = await getTaskForActiveOrganization(ctx, key);

      // Changing the assignee is its own permission on top of editing.
      if (values.assignedToMemberId !== undefined) {
        await assertAnyPermission(ctx, ["tasks.assign"], {
          project: (await loadProjectById(ctx, previousTask.projectId)) ?? null,
          teamId: previousTask.teamId,
        });
      }
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
        parentTaskId?: string | null;
        estimatePoints?: number | null;
        timeSpentMinutes?: number;
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

      if (values.parentTaskId !== undefined) {
        updateValues.parentTaskId = values.parentTaskId;
      }

      if (values.estimatePoints !== undefined) {
        updateValues.estimatePoints = values.estimatePoints;
      }

      if (values.timeSpentMinutes !== undefined) {
        updateValues.timeSpentMinutes = values.timeSpentMinutes;
      }

      if (values.assignedToMemberId !== undefined) {
        updateValues.assignedToMemberId = values.assignedToMemberId;
      }

      if (values.dueAt !== undefined) {
        updateValues.dueAt = values.dueAt;
      }

      const changes = getChangedTaskFields(previousTask, values);

      const updatedTask = await db.transaction(async (tx) => {
        const [row] = await tx
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

        if (!row) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Task not found.",
          });
        }

        if (changes.length) {
          await recordTaskChanges(ctx, tx, previousTask, changes);
        } else {
          // Nothing changed, so there is nothing to record.
          ctx.audit.skipped("task.updated");
        }

        // When a task is marked done, check downstream blocked tasks and notify
        if (values.status === "done" && previousTask.status !== "done") {
          await triggerDownstreamUnblocks(ctx, tx, previousTask);
        }

        // Task keys named in the description link this task to them.
        if (values.description !== undefined) {
          await syncMentions(tx, {
            organizationId: activeOrganization.id,
            memberId: (await getCurrentMember(ctx)).id,
            source: { type: "task", id: row.id },
            text: values.description,
            via: "description",
            mode: "replace",
          });
        }

        return row;
      });

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
  deleteTaskByKey: permissionProcedure("tasks.delete_own", taskByKey("key"), {
    module: "tasks",
    audit: ["task.deleted", "task.unblocked"],
  })
    .input(deleteTaskByKeySchema)
    .mutation(async ({ ctx, input }) => {
      const { db, activeOrganization } = ctx;
      const task = await getTaskForActiveOrganization(ctx, input.key);
      const deletedTask = await db.transaction(async (tx) => {
        const [row] = await tx
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

        if (!row) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Task not found.",
          });
        }

        await ctx.audit.record(tx, {
          action: "task.deleted",
          target: { id: task.id, label: task.key },
          projectId: task.projectId,
          teamId: task.teamId,
          metadata: { name: task.name },
        });

        // Deleting a blocking task also unblocks any downstream tasks
        await triggerDownstreamUnblocks(ctx, tx, task);

        return row;
      });

      return deletedTask;
    }),

  logTime: permissionProcedure("tasks.update_own", taskByKey("key"), {
    module: "tasks",
  })
    .input(logTaskTimeSchema)
    .mutation(async ({ ctx, input }) => {
      const { db, activeOrganization, user } = ctx;
      const { key, durationMinutes, note } = input;

      return await db.transaction(async (tx) => {
        const [task] = await tx
          .select({ id: tasks.id, timeSpentMinutes: tasks.timeSpentMinutes })
          .from(tasks)
          .where(
            and(
              eq(tasks.key, key),
              eq(tasks.organizationId, activeOrganization.id),
              isNull(tasks.deletedAt),
            ),
          )
          .limit(1);

        if (!task) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Task not found.",
          });
        }

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

        const [log] = await tx
          .insert(taskTimeLogs)
          .values({
            organizationId: activeOrganization.id,
            taskId: task.id,
            memberId: member?.id ?? null,
            durationMinutes,
            note: note ?? null,
          })
          .returning();

        if (!log) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create time log entry.",
          });
        }

        const newTotal = (task.timeSpentMinutes ?? 0) + durationMinutes;
        await tx
          .update(tasks)
          .set({ timeSpentMinutes: newTotal, updatedAt: new Date() })
          .where(eq(tasks.id, task.id));

        return { log, totalTimeSpentMinutes: newTotal };
      });
    }),
});
