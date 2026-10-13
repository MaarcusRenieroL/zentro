import { TRPCError } from "@trpc/server";
import { hasOrganizationPermission, type OrganizationRole } from "@zentro/auth";
import { organizationModules } from "@zentro/db/schema";
import { canDisable, canEnable, getModule, listModules } from "@zentro/modules";
import { z } from "zod";

import { loadEnabledModules } from "../modules";
import {
  adminProcedure,
  getCurrentMemberRole,
  protectedProcedure,
  router,
} from "../trpc";

const setEnabledSchema = z.object({
  moduleId: z.string().trim().min(1),
  enabled: z.boolean(),
});

export const modulesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const { db, user, activeOrganization } = ctx;
    const enabled = await loadEnabledModules(db, activeOrganization.id);
    const role = getCurrentMemberRole(
      activeOrganization as {
        members?: { userId?: string | null; role?: string | null }[];
      },
      user.id,
    );
    const canManage =
      !!role &&
      hasOrganizationPermission(role as OrganizationRole, {
        organization: ["update"],
      });

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

  setEnabled: adminProcedure
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

      await db
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

      return { moduleId: manifest.id, enabled: input.enabled };
    }),
});
