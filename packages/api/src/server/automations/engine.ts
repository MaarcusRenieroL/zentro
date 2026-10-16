import { and, eq, isNull, sql } from "@zentro/db/drizzle";
import { automations, tasks } from "@zentro/db/schema";

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
