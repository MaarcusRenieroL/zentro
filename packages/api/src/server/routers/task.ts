import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "@zentro/db/drizzle";
import { members, projects, tasks, users } from "@zentro/db/schema";

import { createTaskSchema } from "../../types/zod-schema";
import { organizationProcedure, protectedProcedure, router } from "../trpc";

export const taskRouter = router({
  createTask: organizationProcedure
    .input(createTaskSchema)
    .mutation(async ({ ctx, input }) => {
      const { db, user, activeOrganization } = ctx;

      return db.transaction(async (tx) => {
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

        return task;
      });
    }),
  getTasksByOrgId: protectedProcedure.query(async ({ ctx }) => {
    const { db, activeOrganization } = ctx;

    const allTasks = await db
      .select({
        id: tasks.id,
        key: tasks.key,
        name: tasks.name,
        project: projects.name,
        status: tasks.status,
        priority: tasks.priority,
        assignee: users.name,
        due: tasks.dueAt,
        createdAt: tasks.createdAt,
      })
      .from(tasks)
      .innerJoin(projects, eq(projects.id, tasks.projectId))
      .leftJoin(members, eq(members.id, tasks.assignedToMemberId))
      .leftJoin(users, eq(users.id, members.userId))
      .where(eq(tasks.organizationId, activeOrganization.id))
      .orderBy(desc(tasks.createdAt));

    return allTasks;
  }),
});
