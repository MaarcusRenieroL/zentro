import { TRPCError } from "@trpc/server";
import { and, asc, eq, inArray, isNull } from "@zentro/db/drizzle";
import { docs, favorites, projects, tasks } from "@zentro/db/schema";
import { z } from "zod";

import { visibleDocsCondition } from "../access";
import { loadProjectById } from "../resources";
import { denialFor, protectedProcedure, router } from "../trpc";
import { resolveTarget } from "./link";

const targetType = z.enum(["project", "doc", "task"]);

export type FavoriteItem = {
  type: "project" | "doc" | "task";
  id: string;
  title: string;
  /** Project key prefix or task key. */
  key: string | null;
  href: string;
};

/**
 * Personal stars on projects, docs and tasks. The list only returns what the
 * caller can still see, so a star on something taken away just disappears.
 */
export const favoriteRouter = router({
  list: protectedProcedure.query(async ({ ctx }): Promise<FavoriteItem[]> => {
    const { db, user, activeOrganization } = ctx;
    const rows = await db
      .select({
        targetType: favorites.targetType,
        targetId: favorites.targetId,
      })
      .from(favorites)
      .where(
        and(
          eq(favorites.organizationId, activeOrganization.id),
          eq(favorites.userId, user.id),
        ),
      )
      .orderBy(asc(favorites.createdAt));

    if (!rows.length) return [];

    const idsOf = (type: string) =>
      rows.filter((row) => row.targetType === type).map((row) => row.targetId);
    const enabled = await ctx.enabledModules();
    const [projectIds, docIds, taskIds] = [
      idsOf("project"),
      idsOf("doc"),
      idsOf("task"),
    ];

    const [projectRows, docRows, taskRows] = await Promise.all([
      projectIds.length && enabled.has("projects")
        ? (async () => {
            const viewable =
              await ctx.permissions.viewableProjectIds("projects.view");
            const ids = projectIds.filter((id) => viewable.includes(id));

            return ids.length
              ? db
                  .select({
                    id: projects.id,
                    title: projects.name,
                    key: projects.taskKeyPrefix,
                    slug: projects.slug,
                  })
                  .from(projects)
                  .where(
                    and(inArray(projects.id, ids), isNull(projects.deletedAt)),
                  )
              : [];
          })()
        : [],
      docIds.length && enabled.has("docs")
        ? (async () =>
            db
              .select({ id: docs.id, title: docs.title, slug: docs.slug })
              .from(docs)
              .where(
                and(
                  eq(docs.organizationId, activeOrganization.id),
                  inArray(docs.id, docIds),
                  isNull(docs.deletedAt),
                  await visibleDocsCondition(ctx.permissions, "docs.view"),
                ),
              ))()
        : [],
      taskIds.length && enabled.has("tasks")
        ? (async () => {
            const viewable =
              await ctx.permissions.viewableProjectIds("tasks.view");

            return viewable.length
              ? db
                  .select({ id: tasks.id, title: tasks.name, key: tasks.key })
                  .from(tasks)
                  .where(
                    and(
                      eq(tasks.organizationId, activeOrganization.id),
                      inArray(tasks.id, taskIds),
                      inArray(tasks.projectId, viewable),
                      isNull(tasks.deletedAt),
                    ),
                  )
              : [];
          })()
        : [],
    ]);

    const items: FavoriteItem[] = [];

    for (const row of rows) {
      if (row.targetType === "project") {
        const project = projectRows.find((entry) => entry.id === row.targetId);

        if (project) {
          items.push({
            type: "project",
            id: project.id,
            title: project.title,
            key: project.key,
            href: `/projects/${project.slug}`,
          });
        }
      } else if (row.targetType === "doc") {
        const doc = docRows.find((entry) => entry.id === row.targetId);

        if (doc) {
          items.push({
            type: "doc",
            id: doc.id,
            title: doc.title || "Untitled",
            key: null,
            href: `/docs/${doc.slug}`,
          });
        }
      } else {
        const task = taskRows.find((entry) => entry.id === row.targetId);

        if (task) {
          items.push({
            type: "task",
            id: task.id,
            title: task.title,
            key: task.key,
            href: `/tasks/${task.key}`,
          });
        }
      }
    }

    return items;
  }),

  toggle: protectedProcedure
    .input(z.object({ type: targetType, id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { db, user, activeOrganization } = ctx;

      // Only something the caller can see can be starred.
      if (input.type === "project") {
        const project = await loadProjectById(ctx, input.id);

        if (!project) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Not found." });
        }

        const decision = await ctx.permissions.check("projects.view", {
          project,
        });

        if (!decision.allowed) throw denialFor(decision);
      } else if (input.type === "doc") {
        await resolveTarget(ctx, { type: "doc", id: input.id });
      } else {
        const [task] = await db
          .select({ key: tasks.key })
          .from(tasks)
          .where(
            and(
              eq(tasks.organizationId, activeOrganization.id),
              eq(tasks.id, input.id),
            ),
          )
          .limit(1);

        if (!task) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Not found." });
        }

        await resolveTarget(ctx, { type: "task", key: task.key });
      }

      const where = and(
        eq(favorites.organizationId, activeOrganization.id),
        eq(favorites.userId, user.id),
        eq(favorites.targetType, input.type),
        eq(favorites.targetId, input.id),
      );
      const removed = await db
        .delete(favorites)
        .where(where)
        .returning({ id: favorites.id });

      if (removed.length) return { favorite: false };

      await db
        .insert(favorites)
        .values({
          organizationId: activeOrganization.id,
          userId: user.id,
          targetType: input.type,
          targetId: input.id,
        })
        .onConflictDoNothing();

      return { favorite: true };
    }),
});
