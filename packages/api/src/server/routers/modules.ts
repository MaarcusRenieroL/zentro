import { TRPCError } from "@trpc/server";
import { organizationModules } from "@zentro/db/schema";
import { canDisable, canEnable, getModule, listModules } from "@zentro/modules";
import { z } from "zod";

import { loadEnabledModules } from "../modules";
import { permissionProcedure, router } from "../trpc";

const setEnabledSchema = z.object({
  moduleId: z.string().trim().min(1),
  enabled: z.boolean(),
});

export const modulesRouter = router({
  list: permissionProcedure("modules.view").query(async ({ ctx }) => {
    const { db, activeOrganization } = ctx;
    const enabled = await loadEnabledModules(db, activeOrganization.id);
    const canManage = await ctx.permissions.can("modules.manage");

    return {
      canManage,
      modules: listModules().map((manifest) => {
        const isEnabled = enabled.has(manifest.id);
        const check = manifest.core
          ? ({ allowed: false, reason: "Always on" } as const)
          : isEnabled
            ? canDisable(manifest.id, enabled)
            : canEnable(manifest.id, enabled);

        return {
          id: manifest.id,
          name: manifest.name,
          description: manifest.description,
          icon: manifest.icon,
          core: manifest.core,
          dependsOn: manifest.dependsOn,
          enabled: isEnabled,
          canToggle: check.allowed,
          reason: check.allowed ? null : check.reason,
        };
      }),
    };
  }),

  setEnabled: permissionProcedure("modules.manage", undefined, {
    audit: ["module.enabled", "module.disabled"],
  })
    .input(setEnabledSchema)
    .mutation(async ({ ctx, input }) => {
      const { db, user, activeOrganization } = ctx;
      const manifest = getModule(input.moduleId);

      if (!manifest) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Unknown module.",
        });
      }

      if (manifest.core) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Core modules are always on.",
        });
      }

      const enabled = await loadEnabledModules(db, activeOrganization.id);

      if (enabled.has(manifest.id) === input.enabled) {
        ctx.audit.skipped("module.enabled");

        return { moduleId: manifest.id, enabled: input.enabled };
      }

      const check = input.enabled
        ? canEnable(manifest.id, enabled)
        : canDisable(manifest.id, enabled);

      if (!check.allowed) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: check.reason,
        });
      }

      await db.transaction(async (tx) => {
        await tx
          .insert(organizationModules)
          .values({
            organizationId: activeOrganization.id,
            moduleId: manifest.id,
            enabled: input.enabled,
            updatedByUserId: user.id,
          })
          .onConflictDoUpdate({
            target: [
              organizationModules.organizationId,
              organizationModules.moduleId,
            ],
            set: {
              enabled: input.enabled,
              updatedByUserId: user.id,
              updatedAt: new Date(),
            },
          });

        await ctx.audit.record(tx, {
          action: input.enabled ? "module.enabled" : "module.disabled",
          target: { id: manifest.id, label: manifest.name },
        });
      });

      return { moduleId: manifest.id, enabled: input.enabled };
    }),
});
