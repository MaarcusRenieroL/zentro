import { and, desc, eq, isNull, sql } from "@zentro/db/drizzle";
import {
  automations,
  chatChannels,
  projects,
  tasks,
  workLinks,
} from "@zentro/db/schema";

import { postChatMessage } from "../chat-post";

type TriggerEvent =
  | "task.status_changed"
  | "task.subtasks_all_done"
  | "task.blockers_resolved"
  | "task.created"
  | "task.due_date_approaching"
  | "task.sla_breach_risk";

type TaskContext = {
  id: string;
  key: string;
  status: string;
  projectId: string;
  parentTaskId?: string | null;
  assignedToMemberId?: string | null;
  priority?: string;
};

type EngineContext = {
  db: any;
  organizationId: string;
  event: TriggerEvent;
  task: TaskContext;
  actorMemberId?: string | null;
  previousStatus?: string;
};

export async function runTaskAutomations({
  db,
  organizationId,
  event,
  task,
  actorMemberId,
  previousStatus,
}: EngineContext) {
  try {
    // Find all active automations for this org matching this event
    const activeRules = await db
      .select()
      .from(automations)
      .where(
        and(
          eq(automations.organizationId, organizationId),
          eq(automations.enabled, true),
          eq(automations.triggerEvent, event),
        ),
      );

    if (!activeRules.length) return;

    for (const rule of activeRules) {
      // Check project scoping
      if (rule.projectId && rule.projectId !== task.projectId) {
        continue;
      }

      const trigConfig = (rule.triggerConfig ?? {}) as Record<string, any>;
      const actionConfig = (rule.actionConfig ?? {}) as Record<string, any>;
      let shouldExecute = false;

      if (event === "task.status_changed") {
        const matchesTo =
          !trigConfig.toStatus || trigConfig.toStatus === task.status;
        const matchesFrom =
          !trigConfig.fromStatus || trigConfig.fromStatus === previousStatus;
        shouldExecute = matchesTo && matchesFrom;
      } else if (event === "task.subtasks_all_done") {
        shouldExecute = true;
      } else if (event === "task.created") {
        shouldExecute = true;
      }

      if (!shouldExecute) continue;

      let executedAction = false;

      // Execute Action
      if (rule.actionType === "update_status" && actionConfig.targetStatus) {
        // If this was triggered because subtasks are all done, update the parent task!
        const targetTaskId =
          event === "task.subtasks_all_done" && task.parentTaskId
            ? task.parentTaskId
            : task.id;

        await db
          .update(tasks)
          .set({ status: actionConfig.targetStatus, updatedAt: new Date() })
          .where(eq(tasks.id, targetTaskId));
        executedAction = true;
      } else if (rule.actionType === "assign_actor" && actorMemberId) {
        // Assign to the actor if currently unassigned
        if (!task.assignedToMemberId) {
          await db
            .update(tasks)
            .set({ assignedToMemberId: actorMemberId, updatedAt: new Date() })
            .where(eq(tasks.id, task.id));
          executedAction = true;
        }
      } else if (rule.actionType === "set_priority" && actionConfig.priority) {
        await db
          .update(tasks)
          .set({ priority: actionConfig.priority, updatedAt: new Date() })
          .where(eq(tasks.id, task.id));
        executedAction = true;
      } else if (
        rule.actionType === "post_to_channel" &&
        actionConfig.channelId
      ) {
        executedAction = await postFromAutomation(db, {
          organizationId,
          channelId: actionConfig.channelId,
          actorMemberId,
          text: `${task.key} · automation “${rule.name}” ran`,
        });
      }

      if (executedAction) {
        await db
          .update(automations)
          .set({
            runCount: sql`${automations.runCount} + 1`,
            lastRunAt: new Date(),
          })
          .where(eq(automations.id, rule.id));
      }
    }
  } catch (error) {
    // Non-blocking automation engine execution
    console.error("Automation engine error:", error);
  }
}

type MessageContext = {
  db: any;
  organizationId: string;
  message: {
    id: string;
    channelId: string;
    parentId: string | null;
    body: string;
    authorMemberId: string | null;
  };
};

/**
 * Posts a line into a channel as an automation would: as the person who
 * caused it, or the channel's creator when nobody did. False when the channel
 * is gone or closed.
 */
async function postFromAutomation(
  db: any,
  input: {
    organizationId: string;
    channelId: string;
    actorMemberId?: string | null;
    text: string;
    parentId?: string | null;
  },
) {
  const [channel] = await db
    .select({
      id: chatChannels.id,
      createdBy: chatChannels.createdByMemberId,
      archivedAt: chatChannels.archivedAt,
    })
    .from(chatChannels)
    .where(
      and(
        eq(chatChannels.id, input.channelId),
        eq(chatChannels.organizationId, input.organizationId),
      ),
    )
    .limit(1);
  const poster = input.actorMemberId ?? channel?.createdBy;

  if (!channel || channel.archivedAt || !poster) return false;

  await postChatMessage(db, {
    organizationId: input.organizationId,
    channelId: input.channelId,
    memberId: poster,
    parentId: input.parentId,
    body: input.text,
    kind: "event",
    meta: { event: "automation" },
  });

  return true;
}

/**
 * Runs the rules that watch chat: "a message contains ...", with an optional
 * channel, then either posts a note or makes a task from the message.
 * Never throws; chat must not break because a rule did.
 */
export async function runMessageAutomations({
  db,
  organizationId,
  message,
}: MessageContext) {
  try {
    const rules = await db
      .select()
      .from(automations)
      .where(
        and(
          eq(automations.organizationId, organizationId),
          eq(automations.enabled, true),
          eq(automations.triggerEvent, "chat.message_contains"),
        ),
      );
    const text = message.body.toLowerCase();

    for (const rule of rules) {
      const trigger = (rule.triggerConfig ?? {}) as Record<string, any>;
      const action = (rule.actionConfig ?? {}) as Record<string, any>;
      const needle = String(trigger.contains ?? "")
        .trim()
        .toLowerCase();

      if (!needle || !text.includes(needle)) continue;
      if (trigger.channelId && trigger.channelId !== message.channelId)
        continue;

      let ran = false;

      if (rule.actionType === "post_to_channel" && action.channelId) {
        ran = await postFromAutomation(db, {
          organizationId,
          channelId: action.channelId,
          actorMemberId: message.authorMemberId,
          text: `Automation “${rule.name}” matched a message in another conversation.`,
        });
      } else if (rule.actionType === "create_task") {
        const projectId = rule.projectId ?? action.projectId;

        if (!projectId || !message.authorMemberId) continue;

        const task = await createTaskFromMessage(db, {
          organizationId,
          projectId,
          memberId: message.authorMemberId,
          message,
        });

        if (task) {
          ran = true;
          await postFromAutomation(db, {
            organizationId,
            channelId: message.channelId,
            actorMemberId: message.authorMemberId,
            parentId: message.parentId ?? message.id,
            text: `created ${task.key} from this message (automation “${rule.name}”)`,
          });
        }
      }

      if (ran) {
        await db
          .update(automations)
          .set({
            runCount: sql`${automations.runCount} + 1`,
            lastRunAt: new Date(),
          })
          .where(eq(automations.id, rule.id));
      }
    }
  } catch (error) {
    console.error("Chat automation error:", error);
  }
}

async function createTaskFromMessage(
  db: any,
  input: {
    organizationId: string;
    projectId: string;
    memberId: string;
    message: MessageContext["message"];
  },
) {
  return db.transaction(async (tx: any) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtextextended(${input.projectId}, 0))`,
    );

    const [project] = await tx
      .select({
        id: projects.id,
        teamId: projects.teamId,
        prefix: projects.taskKeyPrefix,
      })
      .from(projects)
      .where(
        and(
          eq(projects.id, input.projectId),
          eq(projects.organizationId, input.organizationId),
        ),
      )
      .limit(1);

    if (!project) return null;

    const [latest] = await tx
      .select({ taskNumber: tasks.taskNumber })
      .from(tasks)
      .where(eq(tasks.projectId, project.id))
      .orderBy(desc(tasks.taskNumber))
      .limit(1);
    const taskNumber = (latest?.taskNumber ?? 0) + 1;
    const name = input.message.body
      .replace(/<@[0-9a-f-]{36}>/g, "")
      .replace(/<!(?:channel|here)>/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 100);
    const [task] = await tx
      .insert(tasks)
      .values({
        organizationId: input.organizationId,
        projectId: project.id,
        teamId: project.teamId,
        key: `${project.prefix}-${taskNumber}`,
        taskNumber,
        name: name || "Task from chat",
        createdByMemberId: input.memberId,
      })
      .returning({ id: tasks.id, key: tasks.key });

    await tx.insert(workLinks).values({
      organizationId: input.organizationId,
      sourceType: "message",
      sourceId: input.message.id,
      targetType: "task",
      targetId: task.id,
      kind: "relates",
      createdByMemberId: input.memberId,
    });

    return task as { id: string; key: string };
  });
}
