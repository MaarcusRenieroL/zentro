import { TRPCError } from "@trpc/server";
import { and, count, eq, isNull, ne } from "@zentro/db/drizzle";
import { members, tasks, users, workLinks, type Task } from "@zentro/db/schema";
import type { AuditHandle } from "@zentro/audit/server";

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

async function memberName(
  handle: Pick<TRPCContext["db"], "select">,
  id: string | null,
) {
  if (!id) {
    return null;
  }

  const [row] = await handle
    .select({ name: users.name, email: users.email })
    .from(members)
    .innerJoin(users, eq(users.id, members.userId))
    .where(eq(members.id, id))
    .limit(1);

  return row ? row.name || row.email : null;
}

/**
 * Records what an update changed: a status change, an assignment change and
 * the remaining field edits are separate events, so each reads on its own.
 */
export async function recordTaskChanges(
  ctx: TRPCContext,
  tx: AuditHandle & Pick<TRPCContext["db"], "select">,
  task: Pick<Task, "id" | "key" | "name" | "projectId" | "teamId">,
  changes: Array<{
    field: string;
    fromValue: string | null;
    toValue: string | null;
  }>,
) {
  const target = { id: task.id, label: task.key };
  const scope = { projectId: task.projectId, teamId: task.teamId };
  const common = { target, ...scope, metadata: { name: task.name } };
  const status = changes.find((change) => change.field === "status");
  const assignee = changes.find(
    (change) => change.field === "assignedToMemberId",
  );
  const others = changes.filter(
    (change) => change !== status && change !== assignee,
  );

  if (status) {
    await ctx.audit.record(tx, {
      action: "task.status_changed",
      ...common,
      changes: [
        { field: "status", from: status.fromValue, to: status.toValue },
      ],
    });
  }

  if (assignee) {
    await ctx.audit.record(tx, {
      action: "task.assigned",
      ...common,
      // The new assignee's member id, so their inbox can find this event.
      metadata: { ...common.metadata, assignedToMemberId: assignee.toValue },
      changes: [
        {
          field: "assignee",
          from: await memberName(tx, assignee.fromValue),
          to: await memberName(tx, assignee.toValue),
        },
      ],
    });
  }

  if (others.length) {
    await ctx.audit.record(tx, {
      action: "task.updated",
      ...common,
      changes: others.map((change) => ({
        field: change.field,
        from: change.fromValue,
        to: change.toValue,
      })),
    });
  }
}

/**
 * When a task is completed or deleted, any downstream task it was blocking that
 * now has zero open blockers left is considered unblocked. We emit a
 * `task.unblocked` audit event so the assignee receives an inbox notification.
 */
export async function triggerDownstreamUnblocks(
  ctx: TRPCContext,
  tx: AuditHandle & Pick<TRPCContext["db"], "select">,
  completedTask: { id: string; key: string; name: string },
) {
  const { activeOrganization } = ctx;

  if (!activeOrganization?.id) return;

  const orgId = activeOrganization.id;

  const blockedLinks = await tx
    .select({
      targetId: workLinks.targetId,
    })
    .from(workLinks)
    .where(
      and(
        eq(workLinks.organizationId, orgId),
        eq(workLinks.sourceType, "task"),
        eq(workLinks.sourceId, completedTask.id),
        eq(workLinks.targetType, "task"),
        eq(workLinks.kind, "blocks"),
      ),
    );

  if (!blockedLinks.length) return;

  for (const link of blockedLinks) {
    const [targetTask] = await tx
      .select({
        id: tasks.id,
        key: tasks.key,
        name: tasks.name,
        status: tasks.status,
        projectId: tasks.projectId,
        teamId: tasks.teamId,
        assignedToMemberId: tasks.assignedToMemberId,
      })
      .from(tasks)
      .where(
        and(
          eq(tasks.id, link.targetId),
          eq(tasks.organizationId, orgId),
          isNull(tasks.deletedAt),
        ),
      )
      .limit(1);

    if (!targetTask || targetTask.status === "done") continue;

    const [remaining] = await tx
      .select({ count: count() })
      .from(workLinks)
      .innerJoin(tasks, eq(tasks.id, workLinks.sourceId))
      .where(
        and(
          eq(workLinks.organizationId, orgId),
          eq(workLinks.targetType, "task"),
          eq(workLinks.targetId, targetTask.id),
          eq(workLinks.kind, "blocks"),
          eq(workLinks.sourceType, "task"),
          ne(tasks.id, completedTask.id),
          ne(tasks.status, "done"),
          isNull(tasks.deletedAt),
        ),
      );

    if ((remaining?.count ?? 0) === 0) {
      await ctx.audit.record(tx, {
        action: "task.unblocked",
        target: { id: targetTask.id, label: targetTask.key },
        projectId: targetTask.projectId,
        teamId: targetTask.teamId,
        metadata: {
          name: targetTask.name,
          assignedToMemberId: targetTask.assignedToMemberId,
          unblockedByTaskKey: completedTask.key,
          unblockedByTaskName: completedTask.name,
        },
      });
    }
  }
}
