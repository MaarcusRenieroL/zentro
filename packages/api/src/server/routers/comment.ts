import { TRPCError } from "@trpc/server";
import { asc, and, eq, isNull } from "@zentro/db/drizzle";
import { members, taskComments, users } from "@zentro/db/schema";

import {
  createTaskCommentSchema,
  getTaskCommentsSchema,
} from "../../types/zod-schema";
import { permissionProcedure, router } from "../trpc";
import { taskByKey } from "../resources";
import { syncMentions } from "../mentions";
import { getCurrentMember, getTaskForActiveOrganization } from "./task-helpers";

export const commentRouter = router({
  getTaskComments: permissionProcedure("tasks.view", taskByKey("taskKey"), {
    module: "tasks",
  })
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
  createTaskComment: permissionProcedure(
    "tasks.comment",
    taskByKey("taskKey"),
    { module: "tasks", audit: ["task.comment_added"] },
  )
    .input(createTaskCommentSchema)
    .mutation(async ({ ctx, input }) => {
      const { db, activeOrganization } = ctx;
      const task = await getTaskForActiveOrganization(ctx, input.taskKey);
      const member = await getCurrentMember(ctx);

      const comment = await db.transaction(async (tx) => {
        const [row] = await tx
          .insert(taskComments)
          .values({
            organizationId: activeOrganization.id,
            taskId: task.id,
            authorMemberId: member.id,
            body: input.body,
          })
          .returning();

        if (!row) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create comment.",
          });
        }

        await ctx.audit.record(tx, {
          action: "task.comment_added",
          target: { id: task.id, label: task.key },
          projectId: task.projectId,
          teamId: task.teamId,
          metadata: { commentId: row.id, name: task.name },
        });
        await syncMentions(tx, {
          organizationId: activeOrganization.id,
          memberId: member.id,
          source: { type: "task", id: task.id },
          text: input.body,
          via: "comment",
          mode: "append",
        });

        return row;
      });

      return comment;
    }),
});
