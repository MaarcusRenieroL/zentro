import { TRPCError } from "@trpc/server";
import { asc, and, eq, isNull } from "@zentro/db/drizzle";
import { members, taskComments, users } from "@zentro/db/schema";

import {
  createTaskCommentSchema,
  getTaskCommentsSchema,
} from "../../types/zod-schema";
import { moduleProcedure, router } from "../trpc";
import {
  getCurrentMember,
  getTaskForActiveOrganization,
  recordTaskActivity,
} from "./task-helpers";

export const commentRouter = router({
  getTaskComments: moduleProcedure("tasks")
    .input(getTaskCommentsSchema)
    .query(async ({ ctx, input }) => {
      const { db, activeOrganization } = ctx;
      const task = await getTaskForActiveOrganization(ctx, input.taskKey);

      return db
        .select({
          id: taskComments.id,
          body: taskComments.body,
          authorMemberId: taskComments.authorMemberId,
          authorName: users.name,
          authorEmail: users.email,
          authorImage: users.image,
          createdAt: taskComments.createdAt,
          updatedAt: taskComments.updatedAt,
        })
        .from(taskComments)
        .leftJoin(members, eq(members.id, taskComments.authorMemberId))
        .leftJoin(users, eq(users.id, members.userId))
        .where(
          and(
            eq(taskComments.organizationId, activeOrganization.id),
            eq(taskComments.taskId, task.id),
            isNull(taskComments.deletedAt),
          ),
        )
        .orderBy(asc(taskComments.createdAt));
    }),
  createTaskComment: moduleProcedure("tasks")
    .input(createTaskCommentSchema)
    .mutation(async ({ ctx, input }) => {
      const { db, activeOrganization } = ctx;
      const task = await getTaskForActiveOrganization(ctx, input.taskKey);
      const member = await getCurrentMember(ctx);

      const [comment] = await db
        .insert(taskComments)
        .values({
          organizationId: activeOrganization.id,
          taskId: task.id,
          authorMemberId: member.id,
          body: input.body,
        })
        .returning();

      if (!comment) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create comment.",
        });
      }

      await recordTaskActivity(ctx, {
        organizationId: activeOrganization.id,
        taskId: task.id,
        actorMemberId: member.id,
        type: "comment.created",
        commentId: comment.id,
      });

      return comment;
    }),
});
