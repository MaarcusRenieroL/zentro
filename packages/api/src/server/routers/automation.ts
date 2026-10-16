import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { and, desc, eq } from "@zentro/db/drizzle";
import { automations, projects } from "@zentro/db/schema";
import { listProcedure, permissionProcedure, router } from "../trpc";

export const automationRouter = router({
  getAll: listProcedure("tasks.view", "tasks").query(async ({ ctx }) => {
    const { db, activeOrganization } = ctx;

    const rows = await db
      .select({
        id: automations.id,
        name: automations.name,
        description: automations.description,
        enabled: automations.enabled,
        triggerEvent: automations.triggerEvent,
        triggerConfig: automations.triggerConfig,
        actionType: automations.actionType,
        actionConfig: automations.actionConfig,
        runCount: automations.runCount,
        lastRunAt: automations.lastRunAt,
        projectId: automations.projectId,
        projectName: projects.name,
        createdAt: automations.createdAt,
      })
      .from(automations)
      .leftJoin(projects, eq(projects.id, automations.projectId))
      .where(eq(automations.organizationId, activeOrganization.id))
      .orderBy(desc(automations.createdAt));

    return rows;
  }),

  create: permissionProcedure("tasks.create")
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().optional().nullable(),
        projectId: z.string().uuid().optional().nullable(),
        triggerEvent: z.enum([
          "task.status_changed",
          "task.subtasks_all_done",
          "task.blockers_resolved",
          "task.created",
        ]),
        triggerConfig: z.record(z.string(), z.any()).optional().default({}),
        actionType: z.enum(["update_status", "assign_actor", "set_priority"]),
        actionConfig: z.record(z.string(), z.any()).optional().default({}),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { db, activeOrganization, user } = ctx;

      const [member] = await db
        .select({ id: automations.id })
        .from(automations)
        .where(
          and(
            eq(automations.name, input.name),
            eq(automations.organizationId, activeOrganization.id),
          ),
        );

      const [created] = await db
        .insert(automations)
        .values({
          organizationId: activeOrganization.id,
          name: input.name,
          description: input.description ?? null,
          projectId: input.projectId ?? null,
          triggerEvent: input.triggerEvent,
          triggerConfig: input.triggerConfig,
          actionType: input.actionType,
          actionConfig: input.actionConfig,
        })
        .returning();

      return created;
    }),

  toggle: permissionProcedure("tasks.edit")
    .input(z.object({ id: z.string().uuid(), enabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const { db, activeOrganization } = ctx;

      const [updated] = await db
        .update(automations)
        .set({ enabled: input.enabled, updatedAt: new Date() })
        .where(
          and(
            eq(automations.id, input.id),
            eq(automations.organizationId, activeOrganization.id),
          ),
        )
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Automation rule not found.",
        });
      }

      return updated;
    }),

  delete: permissionProcedure("tasks.delete_any")
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { db, activeOrganization } = ctx;

      const [deleted] = await db
        .delete(automations)
        .where(
          and(
            eq(automations.id, input.id),
            eq(automations.organizationId, activeOrganization.id),
          ),
        )
        .returning();

      if (!deleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Automation rule not found.",
        });
      }

      return deleted;
    }),

  seedPresets: permissionProcedure("tasks.create").mutation(async ({ ctx }) => {
    const { db, activeOrganization } = ctx;

    const existing = await db
      .select({ id: automations.id })
      .from(automations)
      .where(eq(automations.organizationId, activeOrganization.id));

    if (existing.length > 0) {
      return { count: 0, message: "Presets already configured." };
    }

    const presets = [
      {
        organizationId: activeOrganization.id,
        name: "Auto-transition parent on subtasks done",
        description:
          "When all subtasks of a task are marked done, transition parent task to Review.",
        enabled: true,
        triggerEvent: "task.subtasks_all_done",
        triggerConfig: {},
        actionType: "update_status",
        actionConfig: { targetStatus: "review" },
      },
      {
        organizationId: activeOrganization.id,
        name: "Auto-assign task on in-progress",
        description:
          "When a task transitions to In Progress and has no assignee, assign it to the active member.",
        enabled: true,
        triggerEvent: "task.status_changed",
        triggerConfig: { toStatus: "in-progress" },
        actionType: "assign_actor",
        actionConfig: {},
      },
      {
        organizationId: activeOrganization.id,
        name: "Auto-start task when blockers clear",
        description:
          "When a task's blocking dependencies are resolved, transition it to In Progress.",
        enabled: true,
        triggerEvent: "task.blockers_resolved",
        triggerConfig: {},
        actionType: "update_status",
        actionConfig: { targetStatus: "in-progress" },
      },
    ];

    const inserted = await db.insert(automations).values(presets).returning();
    return { count: inserted.length, message: "Presets seeded." };
  }),
});
