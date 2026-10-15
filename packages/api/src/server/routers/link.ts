import { TRPCError } from "@trpc/server";
import { and, eq, inArray, isNull, or, type SQL } from "@zentro/db/drizzle";
import {
  docs,
  members,
  projects,
  tasks,
  users,
  workLinks,
} from "@zentro/db/schema";
import { z } from "zod";

import { visibleDocsCondition } from "../access";
import { docById, taskByKey } from "../resources";
import {
  denialFor,
  permissionProcedure,
  protectedProcedure,
  router,
  type OrganizationContext,
} from "../trpc";
import { getCurrentMember } from "./task-helpers";

export type LinkRelation =
  | "blocks"
  | "blocked_by"
  | "relates"
  | "mentions"
  | "mentioned_in";

export type LinkedItem = {
  linkId: string;
  relation: LinkRelation;
  /** Made by a mention in text, so it is removed by editing the text. */
  auto: boolean;
  type: "task" | "doc";
  id: string;
  title: string;
  /** Task key, or the doc's project key. */
  key: string | null;
  status: string | null;
  assignee: string | null;
  href: string;
};

type Ref = { type: "task" | "doc"; id: string };

const uuid = z.string().uuid();

/** Where a link points from the side of `self`. */
function relationFor(
  link: { kind: string; sourceType: string; sourceId: string },
  self: Ref,
): LinkRelation {
  const outgoing = link.sourceType === self.type && link.sourceId === self.id;

  if (link.kind === "blocks") return outgoing ? "blocks" : "blocked_by";
  if (link.kind === "mentions") return outgoing ? "mentions" : "mentioned_in";

  return "relates";
}

/**
 * Every link of one item, each resolved to the other side, keeping only what
 * the caller may see. Turned-off modules simply contribute nothing.
 */
export async function linksOf(
  ctx: OrganizationContext,
  self: Ref,
): Promise<LinkedItem[]> {
  const { db, activeOrganization } = ctx;
  const rows = await db
    .select()
    .from(workLinks)
    .where(
      and(
        eq(workLinks.organizationId, activeOrganization.id),
        or(
          and(
            eq(workLinks.sourceType, self.type),
            eq(workLinks.sourceId, self.id),
          ),
          and(
            eq(workLinks.targetType, self.type),
            eq(workLinks.targetId, self.id),
          ),
        ),
      ),
    );

  if (!rows.length) return [];

  const other = (row: (typeof rows)[number]): Ref =>
    row.sourceType === self.type && row.sourceId === self.id
      ? { type: row.targetType as Ref["type"], id: row.targetId }
      : { type: row.sourceType as Ref["type"], id: row.sourceId };
  const taskIds = rows
    .map(other)
    .filter((ref) => ref.type === "task")
    .map((ref) => ref.id);
  const docIds = rows
    .map(other)
    .filter((ref) => ref.type === "doc")
    .map((ref) => ref.id);
  const enabled = await ctx.enabledModules();

  const [taskRows, docRows] = await Promise.all([
    taskIds.length && enabled.has("tasks")
      ? (async () => {
          const viewable =
            await ctx.permissions.viewableProjectIds("tasks.view");

          if (!viewable.length) return [];

          return db
            .select({
              id: tasks.id,
              key: tasks.key,
              name: tasks.name,
              status: tasks.status,
              assignee: users.name,
            })
            .from(tasks)
            .leftJoin(members, eq(members.id, tasks.assignedToMemberId))
            .leftJoin(users, eq(users.id, members.userId))
            .where(
              and(
                eq(tasks.organizationId, activeOrganization.id),
                inArray(tasks.id, taskIds),
                inArray(tasks.projectId, viewable),
                isNull(tasks.deletedAt),
              ),
            );
        })()
      : [],
    docIds.length && enabled.has("docs")
      ? (async () =>
          db
            .select({
              id: docs.id,
              title: docs.title,
              slug: docs.slug,
              projectKey: projects.taskKeyPrefix,
            })
            .from(docs)
            .leftJoin(projects, eq(projects.id, docs.projectId))
            .where(
              and(
                eq(docs.organizationId, activeOrganization.id),
                inArray(docs.id, docIds),
                isNull(docs.deletedAt),
                await visibleDocsCondition(ctx.permissions, "docs.view"),
              ),
            ))()
      : [],
  ]);

  const items: LinkedItem[] = [];

  for (const row of rows) {
    const ref = other(row);
    const base = {
      linkId: row.id,
      relation: relationFor(row, self),
      auto: row.kind === "mentions" && row.via !== null,
    };

    if (ref.type === "task") {
      const task = taskRows.find((entry) => entry.id === ref.id);

      if (task) {
        items.push({
          ...base,
          type: "task",
          id: task.id,
          title: task.name,
          key: task.key,
          status: task.status,
          assignee: task.assignee,
          href: `/tasks/${task.key}`,
        });
      }
    } else {
      const doc = docRows.find((entry) => entry.id === ref.id);

      if (doc) {
        items.push({
          ...base,
          type: "doc",
          id: doc.id,
          title: doc.title || "Untitled",
          key: doc.projectKey,
          status: null,
          assignee: null,
          href: `/docs/${doc.slug}`,
        });
      }
    }
  }

  return items;
}

async function loadTask(ctx: OrganizationContext, key: string) {
  const [task] = await ctx.db
    .select({
      id: tasks.id,
      key: tasks.key,
      projectId: tasks.projectId,
      teamId: tasks.teamId,
    })
    .from(tasks)
    .where(
      and(
        eq(tasks.organizationId, ctx.activeOrganization.id),
        eq(tasks.key, key),
        isNull(tasks.deletedAt),
      ),
    )
    .limit(1);

  return task;
}

async function loadDoc(ctx: OrganizationContext, id: string) {
  const [doc] = await ctx.db
    .select({
      id: docs.id,
      title: docs.title,
      projectId: docs.projectId,
      teamId: docs.teamId,
    })
    .from(docs)
    .where(
      and(
        eq(docs.organizationId, ctx.activeOrganization.id),
        eq(docs.id, id),
        isNull(docs.deletedAt),
      ),
    )
    .limit(1);

  return doc;
}

/** The other end must exist and be visible to the caller. */
async function resolveTarget(
  ctx: OrganizationContext,
  target: { type: "task"; key: string } | { type: "doc"; id: string },
): Promise<Ref & { label: string }> {
  if (target.type === "task") {
    const task = await loadTask(ctx, target.key);
    const resource = await taskByKey()({ ctx, input: { key: target.key } });

    if (!task || !resource) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Task not found." });
    }

    const decision = await ctx.permissions.check("tasks.view", resource);

    if (!decision.allowed) throw denialFor(decision);

    return { type: "task", id: task.id, label: task.key };
  }

  const doc = await loadDoc(ctx, target.id);
  const resource = await docById()({ ctx, input: { id: target.id } });

  if (!doc || !resource) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Doc not found." });
  }

  const decision = await ctx.permissions.check("docs.view", resource);

  if (!decision.allowed) throw denialFor(decision);

  return { type: "doc", id: doc.id, label: doc.title || "Untitled" };
}

async function insertLink(
  ctx: OrganizationContext,
  from: Ref,
  to: Ref,
  kind: "blocks" | "relates",
  audit: {
    action: "task.linked" | "doc.linked";
    target: { id: string; label: string };
    projectId: string | null;
    teamId: string | null;
    other: string;
  },
) {
  if (from.type === to.type && from.id === to.id) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Something can’t be linked to itself.",
    });
  }

  const member = await getCurrentMember(ctx);
  const filters: SQL[] = [
    eq(workLinks.organizationId, ctx.activeOrganization.id),
    eq(workLinks.kind, kind),
  ];
  // "Relates" reads the same both ways, so either direction already counts.
  const pair = (a: Ref, b: Ref) =>
    and(
      eq(workLinks.sourceType, a.type),
      eq(workLinks.sourceId, a.id),
      eq(workLinks.targetType, b.type),
      eq(workLinks.targetId, b.id),
    )!;
  const [existing] = await ctx.db
    .select({ id: workLinks.id })
    .from(workLinks)
    .where(
      and(
        ...filters,
        kind === "relates"
          ? or(pair(from, to), pair(to, from))
          : pair(from, to),
      ),
    )
    .limit(1);

  if (existing) {
    // Already linked: nothing changed, so nothing is recorded.
    ctx.audit.skipped(audit.action);

    return { id: existing.id, created: false };
  }

  return ctx.db.transaction(async (tx) => {
    const [row] = await tx
      .insert(workLinks)
      .values({
        organizationId: ctx.activeOrganization.id,
        sourceType: from.type,
        sourceId: from.id,
        targetType: to.type,
        targetId: to.id,
        kind,
        createdByMemberId: member.id,
      })
      .returning({ id: workLinks.id });

    await ctx.audit.record(tx, {
      action: audit.action,
      target: audit.target,
      projectId: audit.projectId,
      teamId: audit.teamId,
      metadata: { kind, with: audit.other },
    });

    return { id: row!.id, created: true };
  });
}

const taskTarget = z.discriminatedUnion("type", [
  z.object({ type: z.literal("task"), key: z.string().trim().min(1).max(40) }),
  z.object({ type: z.literal("doc"), id: uuid }),
]);

/**
 * Links between tasks and docs: "blocks" and "relates" are made by people,
 * "mentions" by naming a task key in text (see `syncMentions`).
 */
export const linkRouter = router({
  forTask: permissionProcedure("tasks.view", taskByKey("taskKey"), {
    module: "tasks",
  })
    .input(z.object({ taskKey: z.string().trim().min(1).max(40) }))
    .query(async ({ ctx, input }) => {
      const task = await loadTask(ctx, input.taskKey);

      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found." });
      }

      return linksOf(ctx, { type: "task", id: task.id });
    }),

  forDoc: permissionProcedure("docs.view", docById("docId"), {
    module: "docs",
  })
    .input(z.object({ docId: uuid }))
    .query(async ({ ctx, input }) => {
      const doc = await loadDoc(ctx, input.docId);

      if (!doc) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Doc not found." });
      }

      return linksOf(ctx, { type: "doc", id: doc.id });
    }),

  addFromTask: permissionProcedure("tasks.update_own", taskByKey("taskKey"), {
    module: "tasks",
    also: ["tasks.view", "docs.view"],
    audit: ["task.linked"],
  })
    .input(
      z.object({
        taskKey: z.string().trim().min(1).max(40),
        target: taskTarget,
        kind: z.enum(["blocks", "blocked_by", "relates"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const task = await loadTask(ctx, input.taskKey);

      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found." });
      }

      const target = await resolveTarget(ctx, input.target);

      if (input.kind !== "relates" && target.type !== "task") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only tasks can block each other.",
        });
      }

      const self: Ref = { type: "task", id: task.id };
      const [from, to] =
        input.kind === "blocked_by" ? [target, self] : [self, target];

      return insertLink(
        ctx,
        from,
        to,
        input.kind === "relates" ? "relates" : "blocks",
        {
          action: "task.linked",
          target: { id: task.id, label: task.key },
          projectId: task.projectId,
          teamId: task.teamId,
          other: target.label,
        },
      );
    }),

  addFromDoc: permissionProcedure("docs.update_own", docById("docId"), {
    module: "docs",
    also: ["tasks.view", "docs.view"],
    audit: ["doc.linked"],
  })
    .input(z.object({ docId: uuid, target: taskTarget }))
    .mutation(async ({ ctx, input }) => {
      const doc = await loadDoc(ctx, input.docId);

      if (!doc) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Doc not found." });
      }

      const target = await resolveTarget(ctx, input.target);

      return insertLink(ctx, { type: "doc", id: doc.id }, target, "relates", {
        action: "doc.linked",
        target: { id: doc.id, label: doc.title || "Untitled" },
        projectId: doc.projectId,
        teamId: doc.teamId,
        other: target.label,
      });
    }),

  // Either side's editor may remove a manual link; mentions go away by
  // editing the text that makes them.
  remove: protectedProcedure
    .meta({
      permissions: ["tasks.update_own", "docs.update_own"],
      audit: ["task.unlinked", "doc.unlinked"],
    })
    .input(z.object({ linkId: uuid }))
    .mutation(async ({ ctx, input }) => {
      const [link] = await ctx.db
        .select()
        .from(workLinks)
        .where(
          and(
            eq(workLinks.organizationId, ctx.activeOrganization.id),
            eq(workLinks.id, input.linkId),
          ),
        )
        .limit(1);

      if (!link) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Link not found." });
      }

      if (link.kind === "mentions" && link.via !== null) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "This link comes from a mention. Edit the text to remove it.",
        });
      }

      // The caller must be able to edit one of the two ends.
      const ends: Ref[] = [
        { type: link.sourceType as Ref["type"], id: link.sourceId },
        { type: link.targetType as Ref["type"], id: link.targetId },
      ];
      let allowedEnd:
        | {
            ref: Ref;
            label: string;
            projectId: string | null;
            teamId: string | null;
          }
        | undefined;
      let lastDecision;

      for (const ref of ends) {
        if (ref.type === "task") {
          const [task] = await ctx.db
            .select({
              key: tasks.key,
              projectId: tasks.projectId,
              teamId: tasks.teamId,
            })
            .from(tasks)
            .where(eq(tasks.id, ref.id))
            .limit(1);
          const resource = task
            ? await taskByKey()({ ctx, input: { key: task.key } })
            : undefined;

          if (task && resource) {
            lastDecision = await ctx.permissions.check(
              "tasks.update_own",
              resource,
            );

            if (lastDecision.allowed) {
              allowedEnd = {
                ref,
                label: task.key,
                projectId: task.projectId,
                teamId: task.teamId,
              };
              break;
            }
          }
        } else {
          const doc = await loadDoc(ctx, ref.id);
          const resource = doc
            ? await docById()({ ctx, input: { id: ref.id } })
            : undefined;

          if (doc && resource) {
            lastDecision = await ctx.permissions.check(
              "docs.update_own",
              resource,
            );

            if (lastDecision.allowed) {
              allowedEnd = {
                ref,
                label: doc.title || "Untitled",
                projectId: doc.projectId,
                teamId: doc.teamId,
              };
              break;
            }
          }
        }
      }

      if (!allowedEnd) {
        throw denialFor(lastDecision ?? { allowed: false, reasons: [] });
      }

      await ctx.db.transaction(async (tx) => {
        await tx.delete(workLinks).where(eq(workLinks.id, link.id));
        await ctx.audit.record(tx, {
          action:
            allowedEnd.ref.type === "task" ? "task.unlinked" : "doc.unlinked",
          target: { id: allowedEnd.ref.id, label: allowedEnd.label },
          projectId: allowedEnd.projectId,
          teamId: allowedEnd.teamId,
          metadata: { kind: link.kind },
        });
      });

      return { ok: true };
    }),
});
