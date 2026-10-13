import { and, desc, eq, inArray, type SQL } from "@zentro/db/drizzle";
import {
  activityEvents,
  members,
  taskComments,
  users,
} from "@zentro/db/schema";
import { z } from "zod";

import { getTaskActivityEventsSchema } from "../../types/zod-schema";
import {
  activityPageSize,
  cursorCondition,
  cursorSchema,
  encodeCursor,
  visibleActivityCondition,
} from "../activity";
import {
  assertAnyPermission,
  listProcedure,
  permissionProcedure,
  router,
} from "../trpc";
import { taskByKey } from "../resources";
import { getTaskForActiveOrganization } from "./task-helpers";

const uuid = z.string().uuid();

type TaskActivityRow = {
  id: string;
  type: string;
  field: string | null;
  fromValue: string | null;
  toValue: string | null;
  commentId: string | null;
  commentBody: string | null;
  actorMemberId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  actorImage: string | null;
  createdAt: Date;
};

const listInput = z
  .object({
    targetType: z.string().max(40).optional(),
    targetId: z.string().max(100).optional(),
    projectId: uuid.optional(),
    scope: z.literal("organization").optional(),
    cursor: cursorSchema.optional(),
  })
  .refine(
    (input) =>
      [
        Boolean(input.targetType && input.targetId),
        Boolean(input.projectId),
        input.scope === "organization",
      ].filter(Boolean).length === 1,
    "Choose one of: a target, a project, or the organization.",
  );

export const activityRouter = router({
  // Resource feeds and the organization feed. Only events that are not
  // audit-only, and only for what the caller may view.
  list: listProcedure("activity.view_org")
    .input(listInput)
    .query(async ({ ctx, input }) => {
      if (input.scope === "organization") {
        await assertAnyPermission(ctx, ["activity.view_org"]);
      }

      const visible = await visibleActivityCondition(
        ctx.permissions,
        await ctx.enabledModules(),
      );
      const conditions: Array<SQL | undefined> = [
        eq(activityEvents.organizationId, ctx.activeOrganization.id),
        eq(activityEvents.auditOnly, false),
        visible,
        cursorCondition(input.cursor),
      ];

      if (input.targetType && input.targetId) {
        conditions.push(
          eq(activityEvents.targetType, input.targetType),
          eq(activityEvents.targetId, input.targetId),
        );
      }

      if (input.projectId) {
        conditions.push(eq(activityEvents.projectId, input.projectId));
      }

      const rows = await ctx.db
        .select({
          id: activityEvents.id,
          action: activityEvents.action,
          targetType: activityEvents.targetType,
          targetId: activityEvents.targetId,
          targetLabel: activityEvents.targetLabel,
          projectId: activityEvents.projectId,
          teamId: activityEvents.teamId,
          metadata: activityEvents.metadata,
          createdAt: activityEvents.createdAt,
          actorUserId: activityEvents.actorUserId,
          actorName: users.name,
          actorEmail: users.email,
          actorImage: users.image,
        })
        .from(activityEvents)
        .leftJoin(users, eq(users.id, activityEvents.actorUserId))
        .where(and(...conditions))
        .orderBy(desc(activityEvents.createdAt), desc(activityEvents.id))
        .limit(activityPageSize + 1);

      const hasMore = rows.length > activityPageSize;
      const items = hasMore ? rows.slice(0, activityPageSize) : rows;

      return {
        items,
        nextCursor: hasMore ? encodeCursor(items[items.length - 1]!) : null,
      };
    }),

  // A task's history in the shape the task page has always used: one row per
  // changed field, with comments joined in.
  getTaskActivityEvents: permissionProcedure(
    "tasks.activity.view",
    taskByKey("taskKey"),
    { module: "tasks" },
  )
    .input(getTaskActivityEventsSchema)
    .query(async ({ ctx, input }) => {
      const { db, activeOrganization } = ctx;
      const task = await getTaskForActiveOrganization(ctx, input.taskKey);

      const events = await db
        .select({
          id: activityEvents.id,
          action: activityEvents.action,
          metadata: activityEvents.metadata,
          createdAt: activityEvents.createdAt,
          actorUserId: activityEvents.actorUserId,
          actorMemberId: members.id,
          actorName: users.name,
          actorEmail: users.email,
          actorImage: users.image,
        })
        .from(activityEvents)
        .leftJoin(users, eq(users.id, activityEvents.actorUserId))
        .leftJoin(
          members,
          and(
            eq(members.userId, activityEvents.actorUserId),
            eq(members.organizationId, activeOrganization.id),
          ),
        )
        .where(
          and(
            eq(activityEvents.organizationId, activeOrganization.id),
            eq(activityEvents.targetType, "task"),
            eq(activityEvents.targetId, task.id),
            eq(activityEvents.auditOnly, false),
          ),
        )
        .orderBy(desc(activityEvents.createdAt), desc(activityEvents.id));

      const commentIds = events
        .map((event) => event.metadata?.commentId)
        .filter((id): id is string => typeof id === "string");
      const comments = commentIds.length
        ? await db
            .select({ id: taskComments.id, body: taskComments.body })
            .from(taskComments)
            .where(inArray(taskComments.id, commentIds))
        : [];

      return events.flatMap<TaskActivityRow>((event) => {
        const base = {
          actorMemberId: event.actorMemberId,
          actorName: event.actorName,
          actorEmail: event.actorEmail,
          actorImage: event.actorImage,
          createdAt: event.createdAt,
        };
        const commentId =
          typeof event.metadata?.commentId === "string"
            ? event.metadata.commentId
            : null;

        if (event.action === "task.comment_added") {
          return [
            {
              ...base,
              id: event.id,
              type: "comment.created",
              field: null,
              fromValue: null,
              toValue: null,
              commentId,
              commentBody:
                comments.find((comment) => comment.id === commentId)?.body ??
                null,
            },
          ];
        }

        const changes = Array.isArray(event.metadata?.changes)
          ? (event.metadata.changes as Array<{
              field: string;
              from: string | null;
              to: string | null;
            }>)
          : [];

        if (changes.length) {
          return changes.map((change, index) => ({
            ...base,
            id: index === 0 ? event.id : `${event.id}:${index}`,
            type: "task.updated",
            field: change.field,
            fromValue: change.from,
            toValue: change.to,
            commentId: null,
            commentBody: null,
          }));
        }

        return [
          {
            ...base,
            id: event.id,
            type: event.action,
            field: null,
            fromValue: null,
            toValue: null,
            commentId: null,
            commentBody: null,
          },
        ];
      });
    }),
});
