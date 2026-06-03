import { TRPCError } from "@trpc/server";
import { and, eq, isNull } from "@zentro/db/drizzle";
import {
  members,
  taskActivityEvents,
  tasks,
  type Task,
} from "@zentro/db/schema";

import type { TRPCContext } from "../../types";

export async function getCurrentMember(ctx: TRPCContext) {
  const { db, user, activeOrganization } = ctx;

  if (!user?.id || !activeOrganization?.id) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in",
    });
  }

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

  return member;
}

export async function getTaskForActiveOrganization(
  ctx: TRPCContext,
  key: string,
) {
  const { db, activeOrganization } = ctx;

  if (!activeOrganization?.id) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "No active organization selected",
    });
  }

  const [task] = await db
    .select()
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

  return task;
}

type TaskActivityInput = {
  organizationId: string;
  taskId: string;
  actorMemberId: string | null;
  type: string;
  field?: string | null;
  fromValue?: string | null;
  toValue?: string | null;
  commentId?: string | null;
};

export async function recordTaskActivity(
  ctx: TRPCContext,
  input: TaskActivityInput,
) {
  await ctx.db.insert(taskActivityEvents).values(input);
}

export function serializeActivityValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value);
}

export function getChangedTaskFields(
  previousTask: Task,
  values: {
    name?: string;
    description?: string | null;
    status?: string;
    priority?: string;
    assignedToMemberId?: string | null;
    dueAt?: Date | null;
  },
) {
  const changes: Array<{
    field: string;
    fromValue: string | null;
    toValue: string | null;
  }> = [];

  const trackedFields = [
    ["name", previousTask.name, values.name],
    ["description", previousTask.description, values.description],
    ["status", previousTask.status, values.status],
    ["priority", previousTask.priority, values.priority],
    [
      "assignedToMemberId",
      previousTask.assignedToMemberId,
      values.assignedToMemberId,
    ],
    ["dueAt", previousTask.dueAt, values.dueAt],
  ] as const;

  for (const [field, previousValue, nextValue] of trackedFields) {
    if (nextValue === undefined) {
      continue;
    }

    const fromValue = serializeActivityValue(previousValue);
    const toValue = serializeActivityValue(nextValue);

    if (fromValue !== toValue) {
      changes.push({ field, fromValue, toValue });
    }
  }

  return changes;
}
