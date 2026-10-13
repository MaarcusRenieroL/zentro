import { desc, and, eq } from "@zentro/db/drizzle";
import {
  members,
  taskActivityEvents,
  taskComments,
  users,
} from "@zentro/db/schema";

import { getTaskActivityEventsSchema } from "../../types/zod-schema";
import { permissionProcedure, router } from "../trpc";
import { taskByKey } from "../resources";
import { getTaskForActiveOrganization } from "./task-helpers";

export const activityRouter = router({
  getTaskActivityEvents: permissionProcedure(
    "tasks.activity.view",
    taskByKey("taskKey"),
    { module: "tasks" },
  )
    .input(getTaskActivityEventsSchema)
    .query(async ({ ctx, input }) => {
      const { db, activeOrganization } = ctx;
      const task = await getTaskForActiveOrganization(ctx, input.taskKey);

      return db
        .select({
          id: taskActivityEvents.id,
          type: taskActivityEvents.type,
          field: taskActivityEvents.field,
          fromValue: taskActivityEvents.fromValue,
          toValue: taskActivityEvents.toValue,
          commentId: taskActivityEvents.commentId,
          commentBody: taskComments.body,
          actorMemberId: taskActivityEvents.actorMemberId,
          actorName: users.name,
          actorEmail: users.email,
          actorImage: users.image,
          createdAt: taskActivityEvents.createdAt,
        })
        .from(taskActivityEvents)
        .leftJoin(members, eq(members.id, taskActivityEvents.actorMemberId))
        .leftJoin(users, eq(users.id, members.userId))
        .leftJoin(
          taskComments,
          eq(taskComments.id, taskActivityEvents.commentId),
        )
        .where(
          and(
            eq(taskActivityEvents.organizationId, activeOrganization.id),
            eq(taskActivityEvents.taskId, task.id),
          ),
        )
        .orderBy(desc(taskActivityEvents.createdAt));
    }),
});
