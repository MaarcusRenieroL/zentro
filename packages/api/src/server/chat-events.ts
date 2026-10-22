import { and, eq, isNull, sql } from "@zentro/db/drizzle";
import {
  chatChannels,
  chatFeedRules,
  chatMembers,
  chatMessages,
  members,
  tasks,
  users,
  workLinks,
} from "@zentro/db/schema";

import type { DbHandle } from "./access";
import { normalizeChannelName } from "./chat";
import { postChatMessage } from "./chat-post";

export type TaskEvent = "created" | "done" | "assigned" | "overdue";

type Handle = DbHandle & { transaction: unknown };

/**
 * Tells chat about something that happened to a task: it posts to project
 * channels that opted into that event, and replies in the thread of any chat
 * message the task was created from. Never throws; chat must not break a task
 * update.
 */
export async function postTaskEvent(
  db: DbHandle,
  input: {
    organizationId: string;
    actorMemberId: string | null;
    event: TaskEvent;
    task: { id: string; key: string; name: string; projectId: string };
    assigneeName?: string | null;
  },
) {
  try {
    const { task, event } = input;
    const text =
      event === "created"
        ? `created ${task.key} · ${task.name}`
        : event === "done"
          ? `marked ${task.key} as done`
          : event === "assigned"
            ? `assigned ${task.key} to ${input.assigneeName ?? "someone"}`
            : `${task.key} is overdue · ${task.name}`;
    const meta = { event, taskId: task.id };

    if (input.actorMemberId) {
      const feeds = await db
        .select({ channelId: chatChannels.id })
        .from(chatFeedRules)
        .innerJoin(chatChannels, eq(chatChannels.id, chatFeedRules.channelId))
        .where(
          and(
            eq(chatChannels.organizationId, input.organizationId),
            eq(chatChannels.linkType, "project"),
            eq(chatChannels.linkId, task.projectId),
            isNull(chatChannels.archivedAt),
            eq(chatFeedRules.enabled, true),
            sql`${chatFeedRules.events} ? ${event}`,
          ),
        );

      for (const feed of feeds) {
        await postChatMessage(db, {
          organizationId: input.organizationId,
          channelId: feed.channelId,
          memberId: input.actorMemberId,
          body: text,
          kind: "event",
          meta,
        });
      }
    }

    // Close the loop in the conversation the task came from.
    if (input.actorMemberId && (event === "done" || event === "assigned")) {
      const origins = await db
        .select({
          id: chatMessages.id,
          parentId: chatMessages.parentId,
          channelId: chatMessages.channelId,
        })
        .from(workLinks)
        .innerJoin(chatMessages, eq(chatMessages.id, workLinks.sourceId))
        .where(
          and(
            eq(workLinks.organizationId, input.organizationId),
            eq(workLinks.sourceType, "message"),
            eq(workLinks.targetType, "task"),
            eq(workLinks.targetId, task.id),
            eq(workLinks.kind, "relates"),
            isNull(chatMessages.deletedAt),
          ),
        );

      for (const origin of origins) {
        await postChatMessage(db, {
          organizationId: input.organizationId,
          channelId: origin.channelId,
          memberId: input.actorMemberId,
          parentId: origin.parentId ?? origin.id,
          body: text,
          kind: "event",
          meta,
        });
      }
    }
  } catch (error) {
    console.error("[chat] could not post a task event", error);
  }
}

/** Posts an overdue notice once per task to project channels that asked. */
export async function postOverdueEvents(db: DbHandle & Handle) {
  const rules = await db
    .select({
      channelId: chatChannels.id,
      organizationId: chatChannels.organizationId,
      projectId: chatChannels.linkId,
      createdBy: chatChannels.createdByMemberId,
    })
    .from(chatFeedRules)
    .innerJoin(chatChannels, eq(chatChannels.id, chatFeedRules.channelId))
    .where(
      and(
        eq(chatChannels.linkType, "project"),
        isNull(chatChannels.archivedAt),
        eq(chatFeedRules.enabled, true),
        sql`${chatFeedRules.events} ? 'overdue'`,
      ),
    );
  let posted = 0;

  for (const rule of rules) {
    if (!rule.projectId) continue;

    // Someone to post as: the channel's creator, else any channel member.
    const [poster] = rule.createdBy
      ? [{ id: rule.createdBy }]
      : await db
          .select({ id: chatMembers.memberId })
          .from(chatMembers)
          .where(eq(chatMembers.channelId, rule.channelId))
          .limit(1);

    if (!poster) continue;

    const due = await db
      .select({ id: tasks.id, key: tasks.key, name: tasks.name })
      .from(tasks)
      .where(
        and(
          eq(tasks.projectId, rule.projectId),
          isNull(tasks.deletedAt),
          sql`${tasks.status} <> 'done'`,
          sql`${tasks.dueAt} < now()`,
          sql`not exists (select 1 from ${chatMessages} m where m."channelId" = ${rule.channelId} and m.kind = 'event' and m.meta->>'event' = 'overdue' and m.meta->>'taskId' = ${tasks.id}::text)`,
        ),
      )
      .limit(20);

    for (const task of due) {
      await postChatMessage(db, {
        organizationId: rule.organizationId,
        channelId: rule.channelId,
        memberId: poster.id,
        body: `${task.key} is overdue · ${task.name}`,
        kind: "event",
        meta: { event: "overdue", taskId: task.id },
      });
      posted += 1;
    }
  }

  return posted;
}

/** The display name of a member, for event text. */
export async function memberName(db: DbHandle, memberId: string | null) {
  if (!memberId) return null;

  const [row] = await db
    .select({ name: users.name, email: users.email })
    .from(members)
    .innerJoin(users, eq(users.id, members.userId))
    .where(eq(members.id, memberId))
    .limit(1);

  return row ? row.name || row.email : null;
}

/**
 * Gives a new project its own channel, private to the people who open it, so
 * the project has a place to talk from the start. Never throws.
 */
export async function createProjectChannel(
  db: DbHandle,
  input: {
    organizationId: string;
    userId: string;
    project: { id: string; slug: string; name: string };
  },
) {
  try {
    const [member] = await db
      .select({ id: members.id })
      .from(members)
      .where(
        and(
          eq(members.userId, input.userId),
          eq(members.organizationId, input.organizationId),
        ),
      )
      .limit(1);

    if (!member) return;

    const [channel] = await db
      .insert(chatChannels)
      .values({
        organizationId: input.organizationId,
        kind: "channel",
        name: normalizeChannelName(`project-${input.project.slug}`),
        topic: input.project.name.slice(0, 250),
        visibility: "private",
        linkType: "project",
        linkId: input.project.id,
        createdByMemberId: member.id,
      })
      .onConflictDoNothing()
      .returning({ id: chatChannels.id });

    if (channel) {
      await db
        .insert(chatMembers)
        .values({ channelId: channel.id, memberId: member.id, role: "admin" })
        .onConflictDoNothing();
    }
  } catch (error) {
    console.error("[chat] could not create the project channel", error);
  }
}
