import {
  and,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNull,
  ne,
  or,
  sql,
} from "@zentro/db/drizzle";
import {
  activityEvents,
  docComments,
  docs,
  members,
  notificationReads,
  taskComments,
  tasks,
  users,
  workLinks,
} from "@zentro/db/schema";
import { z } from "zod";

import { visibleDocsCondition } from "../access";
import { protectedProcedure, router } from "../trpc";
import { getCurrentMember } from "./task-helpers";

const WINDOW_DAYS = 30;
const LIMIT = 60;

export type NotificationKind = "mention" | "assignment" | "comment";

export type InboxItem = {
  /** Stable per source row, so read marks survive reloads. */
  id: string;
  kind: NotificationKind;
  actor: string;
  verb: string;
  object: string;
  objectIsKey: boolean;
  title: string | null;
  quote: string | null;
  createdAt: Date;
  href: string;
  unread: boolean;
};

function excerpt(body: string) {
  // Comments may be stored as HTML or Markdown; the quote is plain text.
  const text = body
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

  return text.length > 160 ? `${text.slice(0, 157)}…` : text;
}

/**
 * The inbox: tasks given to you, comments on your tasks and docs, and
 * comments that mention you by first name. Derived from the work itself, so
 * nothing has to be written when the work happens; only read marks are kept.
 */
export const notificationRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const { db, user, activeOrganization } = ctx;
    const me = await getCurrentMember(ctx);
    const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const firstName = (user.name ?? "").trim().split(/\s+/)[0] ?? "";
    // "@Priya" but not "@Priyanka": the name must end the word.
    const mentionPattern = firstName.length >= 2 ? `%@${firstName}%` : null;
    const mentions = (body: string) =>
      mentionPattern !== null &&
      new RegExp(
        `@${firstName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
        "i",
      ).test(body);
    const enabled = await ctx.enabledModules();
    const taskProjects = enabled.has("tasks")
      ? await ctx.permissions.viewableProjectIds("tasks.view")
      : [];
    const docsVisible = enabled.has("docs")
      ? await visibleDocsCondition(ctx.permissions, "docs.view")
      : null;

    const author = users.name;
    const [assignmentRows, taskCommentRows, docCommentRows, reads] =
      await Promise.all([
        taskProjects.length
          ? db
              .select({
                id: activityEvents.id,
                createdAt: activityEvents.createdAt,
                actor: users.name,
                key: tasks.key,
                name: tasks.name,
              })
              .from(activityEvents)
              .innerJoin(
                tasks,
                sql`${tasks.id}::text = ${activityEvents.targetId}`,
              )
              .leftJoin(users, eq(users.id, activityEvents.actorUserId))
              .where(
                and(
                  eq(activityEvents.organizationId, activeOrganization.id),
                  inArray(activityEvents.action, [
                    "task.created",
                    "task.assigned",
                  ]),
                  sql`${activityEvents.metadata}->>'assignedToMemberId' = ${me.id}`,
                  or(
                    isNull(activityEvents.actorUserId),
                    ne(activityEvents.actorUserId, user.id),
                  ),
                  gte(activityEvents.createdAt, since),
                  isNull(tasks.deletedAt),
                  inArray(tasks.projectId, taskProjects),
                ),
              )
              .orderBy(desc(activityEvents.createdAt))
              .limit(LIMIT)
          : [],
        taskProjects.length
          ? db
              .select({
                id: taskComments.id,
                body: taskComments.body,
                createdAt: taskComments.createdAt,
                actor: author,
                key: tasks.key,
                name: tasks.name,
                mine: sql<boolean>`(${tasks.assignedToMemberId} = ${me.id} or ${tasks.createdByMemberId} = ${me.id})`,
              })
              .from(taskComments)
              .innerJoin(tasks, eq(tasks.id, taskComments.taskId))
              .leftJoin(members, eq(members.id, taskComments.authorMemberId))
              .leftJoin(users, eq(users.id, members.userId))
              .where(
                and(
                  eq(taskComments.organizationId, activeOrganization.id),
                  isNull(taskComments.deletedAt),
                  isNull(tasks.deletedAt),
                  gte(taskComments.createdAt, since),
                  or(
                    isNull(taskComments.authorMemberId),
                    ne(taskComments.authorMemberId, me.id),
                  ),
                  inArray(tasks.projectId, taskProjects),
                  or(
                    eq(tasks.assignedToMemberId, me.id),
                    eq(tasks.createdByMemberId, me.id),
                    mentionPattern
                      ? ilike(taskComments.body, mentionPattern)
                      : sql`false`,
                  ),
                ),
              )
              .orderBy(desc(taskComments.createdAt))
              .limit(LIMIT)
          : [],
        docsVisible
          ? db
              .select({
                id: docComments.id,
                body: docComments.body,
                createdAt: docComments.createdAt,
                actor: author,
                title: docs.title,
                slug: docs.slug,
                mine: sql<boolean>`(${docs.createdByMemberId} = ${me.id})`,
              })
              .from(docComments)
              .innerJoin(docs, eq(docs.id, docComments.docId))
              .leftJoin(members, eq(members.id, docComments.authorMemberId))
              .leftJoin(users, eq(users.id, members.userId))
              .where(
                and(
                  eq(docComments.organizationId, activeOrganization.id),
                  isNull(docComments.deletedAt),
                  isNull(docs.deletedAt),
                  gte(docComments.createdAt, since),
                  or(
                    isNull(docComments.authorMemberId),
                    ne(docComments.authorMemberId, me.id),
                  ),
                  docsVisible,
                  or(
                    eq(docs.createdByMemberId, me.id),
                    mentionPattern
                      ? ilike(docComments.body, mentionPattern)
                      : sql`false`,
                  ),
                ),
              )
              .orderBy(desc(docComments.createdAt))
              .limit(LIMIT)
          : [],
        db
          .select({
            itemKey: notificationReads.itemKey,
            readAt: notificationReads.readAt,
          })
          .from(notificationReads)
          .where(
            and(
              eq(notificationReads.organizationId, activeOrganization.id),
              eq(notificationReads.userId, user.id),
            ),
          ),
      ]);

    const allReadAt = reads.find((row) => row.itemKey === "*")?.readAt;
    const readKeys = new Set(reads.map((row) => row.itemKey));
    const items: Array<Omit<InboxItem, "unread">> = [];

    for (const row of assignmentRows) {
      items.push({
        id: `assign:${row.id}`,
        kind: "assignment",
        actor: row.actor ?? "Someone",
        verb: "assigned you",
        object: row.key,
        objectIsKey: true,
        title: row.name,
        quote: null,
        createdAt: row.createdAt,
        href: `/tasks/${row.key}`,
      });
    }

    for (const row of taskCommentRows) {
      const mentioned = mentions(row.body);

      // A comment that neither mentions you nor sits on your task is not yours.
      if (!mentioned && !row.mine) continue;

      items.push({
        id: `task-comment:${row.id}`,
        kind: mentioned ? "mention" : "comment",
        actor: row.actor ?? "Someone",
        verb: mentioned ? "mentioned you in" : "commented on",
        object: row.key,
        objectIsKey: true,
        title: row.name,
        quote: excerpt(row.body),
        createdAt: row.createdAt,
        href: `/tasks/${row.key}`,
      });
    }

    // Your tasks named in someone else's doc or task text.
    const mentionLinks = taskProjects.length
      ? await db
          .select({
            id: workLinks.id,
            createdAt: workLinks.createdAt,
            sourceType: workLinks.sourceType,
            sourceId: workLinks.sourceId,
            actor: users.name,
            key: tasks.key,
          })
          .from(workLinks)
          .innerJoin(tasks, eq(tasks.id, workLinks.targetId))
          .leftJoin(members, eq(members.id, workLinks.createdByMemberId))
          .leftJoin(users, eq(users.id, members.userId))
          .where(
            and(
              eq(workLinks.organizationId, activeOrganization.id),
              eq(workLinks.kind, "mentions"),
              inArray(workLinks.via, ["content", "description"]),
              ne(workLinks.createdByMemberId, me.id),
              gte(workLinks.createdAt, since),
              isNull(tasks.deletedAt),
              inArray(tasks.projectId, taskProjects),
              or(
                eq(tasks.assignedToMemberId, me.id),
                eq(tasks.createdByMemberId, me.id),
              ),
            ),
          )
          .orderBy(desc(workLinks.createdAt))
          .limit(LIMIT)
      : [];
    const sourceDocIds = mentionLinks
      .filter((row) => row.sourceType === "doc")
      .map((row) => row.sourceId);
    const sourceTaskIds = mentionLinks
      .filter((row) => row.sourceType === "task")
      .map((row) => row.sourceId);
    const [sourceDocs, sourceTasks] = await Promise.all([
      sourceDocIds.length && docsVisible
        ? db
            .select({ id: docs.id, title: docs.title, slug: docs.slug })
            .from(docs)
            .where(
              and(
                inArray(docs.id, sourceDocIds),
                isNull(docs.deletedAt),
                docsVisible,
              ),
            )
        : [],
      sourceTaskIds.length
        ? db
            .select({ id: tasks.id, key: tasks.key })
            .from(tasks)
            .where(
              and(
                inArray(tasks.id, sourceTaskIds),
                isNull(tasks.deletedAt),
                inArray(tasks.projectId, taskProjects),
              ),
            )
        : [],
    ]);

    for (const row of mentionLinks) {
      const doc = sourceDocs.find((entry) => entry.id === row.sourceId);
      const task = sourceTasks.find((entry) => entry.id === row.sourceId);
      const where = doc
        ? {
            object: doc.title || "Untitled",
            isKey: false,
            href: `/docs/${doc.slug}`,
          }
        : task
          ? { object: task.key, isKey: true, href: `/tasks/${task.key}` }
          : null;

      // A source the caller cannot see stays out of the inbox.
      if (!where) continue;

      items.push({
        id: `link:${row.id}`,
        kind: "mention",
        actor: row.actor ?? "Someone",
        verb: `linked ${row.key} in`,
        object: where.object,
        objectIsKey: where.isKey,
        title: null,
        quote: null,
        createdAt: row.createdAt,
        href: where.href,
      });
    }

    for (const row of docCommentRows) {
      const mentioned = mentions(row.body);

      if (!mentioned && !row.mine) continue;

      items.push({
        id: `doc-comment:${row.id}`,
        kind: mentioned ? "mention" : "comment",
        actor: row.actor ?? "Someone",
        verb: mentioned ? "mentioned you in" : "commented on",
        object: row.title || "Untitled",
        objectIsKey: false,
        title: null,
        quote: excerpt(row.body),
        createdAt: row.createdAt,
        href: `/docs/${row.slug}`,
      });
    }

    return items
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, LIMIT)
      .map(
        (item): InboxItem => ({
          ...item,
          unread:
            !readKeys.has(item.id) &&
            !(allReadAt && item.createdAt <= allReadAt),
        }),
      );
  }),

  markRead: protectedProcedure
    .input(z.object({ id: z.string().min(1).max(120) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .insert(notificationReads)
        .values({
          organizationId: ctx.activeOrganization.id,
          userId: ctx.user.id,
          itemKey: input.id,
        })
        .onConflictDoNothing();

      return { ok: true };
    }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    const { db, activeOrganization, user } = ctx;
    const scope = and(
      eq(notificationReads.organizationId, activeOrganization.id),
      eq(notificationReads.userId, user.id),
    );

    // One "everything until now" mark replaces the single ones.
    await db.transaction(async (tx) => {
      await tx.delete(notificationReads).where(scope);
      await tx.insert(notificationReads).values({
        organizationId: activeOrganization.id,
        userId: user.id,
        itemKey: "*",
      });
    });

    return { ok: true };
  }),
});
