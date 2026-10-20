import { TRPCError } from "@trpc/server";
import {
  and,
  asc,
  desc,
  eq,
  gt,
  gte,
  ilike,
  inArray,
  isNull,
  lt,
  lte,
  or,
  sql,
  type SQL,
} from "@zentro/db/drizzle";
import {
  chatAttachments,
  chatChannels,
  chatMembers,
  chatMessages,
  chatReactions,
  files,
  members,
  tasks,
  users,
} from "@zentro/db/schema";
import { z } from "zod";

import {
  channelAccess,
  currentMemberId,
  memberProfiles,
  mentionedMemberIds,
  plainBody,
  readableChannel,
  readableChannelIds,
  type Profile,
} from "../chat";
import { syncMentions, taskKeysIn } from "../mentions";
import { permissionProcedure, type OrganizationContext } from "../trpc";

const uuid = z.string().uuid();
const PAGE = 50;

const chatProcedure = (permission: string, options: { also?: string[] } = {}) =>
  permissionProcedure(permission, undefined, { module: "chat", ...options });

type Row = typeof chatMessages.$inferSelect;

export type ChatAttachment = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  url: string;
};

export type ChatTaskRef = {
  id: string;
  key: string;
  name: string;
  status: string;
  assignee: string | null;
};

export type ChatMessageView = {
  id: string;
  channelId: string;
  parentId: string | null;
  clientId: string | null;
  author: Pick<Profile, "memberId" | "name" | "presence"> | null;
  mine: boolean;
  body: string;
  createdAt: Date;
  editedAt: Date | null;
  deleted: boolean;
  pinned: boolean;
  /** Display names of the people mentioned, by member id. */
  names: Record<string, string>;
  reactions: Array<{
    emoji: string;
    count: number;
    mine: boolean;
    names: string[];
  }>;
  attachments: ChatAttachment[];
  tasks: ChatTaskRef[];
  replies: { count: number; lastAt: Date | null; people: string[] } | null;
};

/** Everything a message needs on screen, for a batch of rows at once. */
export async function hydrateMessages(
  ctx: OrganizationContext,
  rows: Row[],
  memberId: string,
  options: { withReplies?: boolean } = {},
): Promise<ChatMessageView[]> {
  if (!rows.length) return [];

  const ids = rows.map((row) => row.id);
  const [reactionRows, attachmentRows, replyRows] = await Promise.all([
    ctx.db
      .select({
        messageId: chatReactions.messageId,
        emoji: chatReactions.emoji,
        memberId: chatReactions.memberId,
      })
      .from(chatReactions)
      .where(inArray(chatReactions.messageId, ids))
      .orderBy(asc(chatReactions.createdAt)),
    ctx.db
      .select({
        messageId: chatAttachments.messageId,
        id: files.id,
        name: files.name,
        mimeType: files.mimeType,
        size: files.size,
        width: files.width,
        height: files.height,
      })
      .from(chatAttachments)
      .innerJoin(files, eq(files.id, chatAttachments.fileId))
      .where(
        and(inArray(chatAttachments.messageId, ids), isNull(files.deletedAt)),
      )
      .orderBy(asc(chatAttachments.position)),
    options.withReplies
      ? ctx.db
          .select({
            parentId: chatMessages.parentId,
            count: sql<number>`count(*)`.mapWith(Number),
            lastAt: sql<Date>`max(${chatMessages.createdAt})`,
            people: sql<
              string[]
            >`array_agg(distinct ${chatMessages.authorMemberId}::text)`,
          })
          .from(chatMessages)
          .where(
            and(
              inArray(chatMessages.parentId, ids),
              isNull(chatMessages.deletedAt),
            ),
          )
          .groupBy(chatMessages.parentId)
      : [],
  ]);

  const peopleIds = new Set<string>();

  for (const row of rows) {
    if (row.authorMemberId) peopleIds.add(row.authorMemberId);
    mentionedMemberIds(row.body).forEach((id) => peopleIds.add(id));
  }

  reactionRows.forEach((row) => peopleIds.add(row.memberId));
  replyRows.forEach((row) =>
    row.people.forEach((id) => id && peopleIds.add(id)),
  );

  const profiles = await memberProfiles(ctx, [...peopleIds]);
  const nameOf = (id: string) => profiles.get(id)?.name ?? "Someone";

  // Task keys become cards, but only for tasks the caller can see.
  const keys = [...new Set(rows.flatMap((row) => taskKeysIn(row.body)))];
  const enabled = await ctx.enabledModules();
  const viewable =
    keys.length && enabled.has("tasks")
      ? await ctx.permissions.viewableProjectIds("tasks.view")
      : [];
  const taskRows = viewable.length
    ? await ctx.db
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
            eq(tasks.organizationId, ctx.activeOrganization.id),
            inArray(tasks.key, keys),
            inArray(tasks.projectId, viewable),
            isNull(tasks.deletedAt),
          ),
        )
    : [];

  return rows.map((row) => {
    const deleted = Boolean(row.deletedAt);
    const reactions = new Map<
      string,
      { emoji: string; count: number; mine: boolean; names: string[] }
    >();

    for (const reaction of reactionRows) {
      if (reaction.messageId !== row.id) continue;

      const entry = reactions.get(reaction.emoji) ?? {
        emoji: reaction.emoji,
        count: 0,
        mine: false,
        names: [],
      };

      entry.count += 1;
      entry.mine ||= reaction.memberId === memberId;
      entry.names.push(nameOf(reaction.memberId));
      reactions.set(reaction.emoji, entry);
    }

    const reply = replyRows.find((entry) => entry.parentId === row.id);
    const author = row.authorMemberId
      ? profiles.get(row.authorMemberId)
      : undefined;

    return {
      id: row.id,
      channelId: row.channelId,
      parentId: row.parentId,
      clientId: row.clientId,
      author: author
        ? {
            memberId: author.memberId,
            name: author.name,
            presence: author.presence,
          }
        : null,
      mine: row.authorMemberId === memberId,
      body: deleted ? "" : row.body,
      createdAt: row.createdAt,
      editedAt: row.editedAt,
      deleted,
      pinned: Boolean(row.pinnedAt),
      names: Object.fromEntries(
        mentionedMemberIds(row.body).map((id) => [id, nameOf(id)]),
      ),
      reactions: deleted ? [] : [...reactions.values()],
      attachments: deleted
        ? []
        : attachmentRows
            .filter((entry) => entry.messageId === row.id)
            .map((entry) => ({
              id: entry.id,
              name: entry.name,
              mimeType: entry.mimeType,
              size: entry.size,
              width: entry.width,
              height: entry.height,
              url: `/api/files/${entry.id}`,
            })),
      tasks: deleted
        ? []
        : taskKeysIn(row.body)
            .map((key) => taskRows.find((task) => task.key === key))
            .filter((task) => task !== undefined),
      replies:
        options.withReplies && reply
          ? {
              count: reply.count,
              lastAt: reply.lastAt,
              people: reply.people.filter(Boolean).map(nameOf).slice(0, 3),
            }
          : options.withReplies
            ? { count: 0, lastAt: null, people: [] }
            : null,
    };
  });
}

async function loadMessage(ctx: OrganizationContext, messageId: string) {
  const [row] = await ctx.db
    .select()
    .from(chatMessages)
    .where(
      and(
        eq(chatMessages.id, messageId),
        eq(chatMessages.organizationId, ctx.activeOrganization.id),
      ),
    )
    .limit(1);

  if (!row) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Message not found." });
  }

  return row;
}

/** Files the caller uploaded and has not attached anywhere yet. */
async function claimFiles(
  ctx: OrganizationContext,
  memberId: string,
  fileIds: string[],
) {
  if (!fileIds.length) return [];

  const rows = await ctx.db
    .select({ id: files.id })
    .from(files)
    .leftJoin(chatAttachments, eq(chatAttachments.fileId, files.id))
    .where(
      and(
        inArray(files.id, fileIds),
        eq(files.organizationId, ctx.activeOrganization.id),
        eq(files.uploadedByMemberId, memberId),
        isNull(files.deletedAt),
        isNull(chatAttachments.id),
      ),
    );
  const owned = new Set(rows.map((row) => row.id));

  return fileIds.filter((id) => owned.has(id));
}

export const chatMessageProcedures = {
  /** A page of top-level messages, oldest first; or the page around one. */
  messages: chatProcedure("chat.view")
    .input(
      z.object({
        channelId: uuid,
        before: z.coerce.date().optional(),
        aroundId: uuid.optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const access = await readableChannel(ctx, input.channelId);
      const base = and(
        eq(chatMessages.channelId, input.channelId),
        isNull(chatMessages.parentId),
      );
      let rows: Row[];

      if (input.aroundId) {
        const anchor = await loadMessage(ctx, input.aroundId);
        const at = anchor.parentId
          ? (await loadMessage(ctx, anchor.parentId)).createdAt
          : anchor.createdAt;
        const [older, newer] = await Promise.all([
          ctx.db
            .select()
            .from(chatMessages)
            .where(and(base, lte(chatMessages.createdAt, at)))
            .orderBy(desc(chatMessages.createdAt))
            .limit(PAGE / 2),
          ctx.db
            .select()
            .from(chatMessages)
            .where(and(base, gt(chatMessages.createdAt, at)))
            .orderBy(asc(chatMessages.createdAt))
            .limit(PAGE / 2),
        ]);

        rows = [...older.reverse(), ...newer];
      } else {
        rows = (
          await ctx.db
            .select()
            .from(chatMessages)
            .where(
              and(
                base,
                input.before
                  ? lt(chatMessages.createdAt, input.before)
                  : undefined,
              ),
            )
            .orderBy(desc(chatMessages.createdAt))
            .limit(PAGE + 1)
        ).reverse();
      }

      const hasMore = !input.aroundId && rows.length > PAGE;
      const page = hasMore ? rows.slice(1) : rows;

      return {
        messages: await hydrateMessages(ctx, page, access.memberId, {
          withReplies: true,
        }),
        hasMore: input.aroundId ? true : hasMore,
      };
    }),

  /** A thread: the first message and every reply. */
  thread: chatProcedure("chat.view")
    .input(z.object({ messageId: uuid }))
    .query(async ({ ctx, input }) => {
      const parent = await loadMessage(ctx, input.messageId);
      const access = await readableChannel(ctx, parent.channelId);
      const replies = await ctx.db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.parentId, parent.id))
        .orderBy(asc(chatMessages.createdAt));
      const [head, ...rest] = await hydrateMessages(
        ctx,
        [parent, ...replies],
        access.memberId,
      );

      return { parent: head!, replies: rest };
    }),

  send: chatProcedure("chat.post", { also: ["chat.files.upload"] })
    .input(
      z.object({
        channelId: uuid,
        body: z.string().max(10_000).default(""),
        parentId: uuid.optional(),
        clientId: z.string().max(64).optional(),
        fileIds: z.array(uuid).max(10).default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const body = input.body.trim();

      if (!body && !input.fileIds.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Write something or attach a file.",
        });
      }

      const access = await channelAccess(ctx, input.channelId);

      if (!access.canPost) {
        throw new TRPCError({
          code: access.canRead ? "FORBIDDEN" : "NOT_FOUND",
          message: access.channel.archivedAt
            ? "This channel is archived."
            : access.canRead
              ? "You can't post here."
              : "Channel not found.",
        });
      }

      if (
        input.fileIds.length &&
        !(await ctx.permissions.can("chat.files.upload"))
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can't share files here.",
        });
      }

      // The same queued message sent twice is one message.
      if (input.clientId) {
        const [existing] = await ctx.db
          .select()
          .from(chatMessages)
          .where(
            and(
              eq(chatMessages.authorMemberId, access.memberId),
              eq(chatMessages.clientId, input.clientId),
            ),
          )
          .limit(1);

        if (existing) {
          return (await hydrateMessages(ctx, [existing], access.memberId))[0]!;
        }
      }

      if (input.parentId) {
        const parent = await loadMessage(ctx, input.parentId);

        if (parent.channelId !== input.channelId || parent.parentId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Reply in the thread of a message in this channel.",
          });
        }
      }

      const fileIds = await claimFiles(ctx, access.memberId, input.fileIds);
      const row = await ctx.db.transaction(async (tx) => {
        // Posting in a public channel joins it.
        if (!access.membership) {
          await tx
            .insert(chatMembers)
            .values({ channelId: input.channelId, memberId: access.memberId })
            .onConflictDoNothing();
        }

        const now = new Date();
        const [message] = await tx
          .insert(chatMessages)
          .values({
            organizationId: ctx.activeOrganization.id,
            channelId: input.channelId,
            authorMemberId: access.memberId,
            parentId: input.parentId ?? null,
            clientId: input.clientId ?? null,
            body,
            createdAt: now,
          })
          .returning();

        if (fileIds.length) {
          await tx.insert(chatAttachments).values(
            fileIds.map((fileId, position) => ({
              messageId: message!.id,
              fileId,
              position,
            })),
          );
        }

        await tx
          .update(chatChannels)
          .set({ lastMessageAt: now })
          .where(eq(chatChannels.id, input.channelId));
        // What you send, you have read.
        await tx
          .update(chatMembers)
          .set({ lastReadAt: now })
          .where(
            and(
              eq(chatMembers.channelId, input.channelId),
              eq(chatMembers.memberId, access.memberId),
            ),
          );
        // Task keys in a message link it to those tasks ("Discussed in").
        await syncMentions(tx, {
          organizationId: ctx.activeOrganization.id,
          memberId: access.memberId,
          source: { type: "message", id: message!.id },
          text: body,
          via: "chat",
          mode: "replace",
        });

        return message!;
      });

      return (
        await hydrateMessages(ctx, [row], access.memberId, {
          withReplies: !row.parentId,
        })
      )[0]!;
    }),

  edit: chatProcedure("chat.post")
    .input(
      z.object({ messageId: uuid, body: z.string().trim().min(1).max(10_000) }),
    )
    .mutation(async ({ ctx, input }) => {
      const message = await loadMessage(ctx, input.messageId);
      const memberId = await currentMemberId(ctx);

      if (message.authorMemberId !== memberId || message.deletedAt) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only edit your own messages.",
        });
      }

      await ctx.db.transaction(async (tx) => {
        await tx
          .update(chatMessages)
          .set({ body: input.body, editedAt: new Date() })
          .where(eq(chatMessages.id, message.id));
        await syncMentions(tx, {
          organizationId: ctx.activeOrganization.id,
          memberId,
          source: { type: "message", id: message.id },
          text: input.body,
          via: "chat",
          mode: "replace",
        });
      });

      return { ok: true };
    }),

  remove: chatProcedure("chat.post", { also: ["chat.channels.manage"] })
    .input(z.object({ messageId: uuid }))
    .mutation(async ({ ctx, input }) => {
      const message = await loadMessage(ctx, input.messageId);
      const access = await channelAccess(ctx, message.channelId);

      if (message.authorMemberId !== access.memberId && !access.canManage) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own messages.",
        });
      }

      await ctx.db.transaction(async (tx) => {
        await tx
          .update(chatMessages)
          .set({ deletedAt: new Date(), pinnedAt: null })
          .where(eq(chatMessages.id, message.id));
        await syncMentions(tx, {
          organizationId: ctx.activeOrganization.id,
          memberId: access.memberId,
          source: { type: "message", id: message.id },
          text: "",
          via: "chat",
          mode: "replace",
        });
      });

      return { ok: true };
    }),

  /** Adds the reaction, or takes it back when it is already yours. */
  react: chatProcedure("chat.post")
    .input(z.object({ messageId: uuid, emoji: z.string().min(1).max(16) }))
    .mutation(async ({ ctx, input }) => {
      const message = await loadMessage(ctx, input.messageId);
      const access = await channelAccess(ctx, message.channelId);

      if (!access.canPost || message.deletedAt) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can't react here.",
        });
      }

      const removed = await ctx.db
        .delete(chatReactions)
        .where(
          and(
            eq(chatReactions.messageId, message.id),
            eq(chatReactions.memberId, access.memberId),
            eq(chatReactions.emoji, input.emoji),
          ),
        )
        .returning({ id: chatReactions.id });

      if (!removed.length) {
        await ctx.db
          .insert(chatReactions)
          .values({
            messageId: message.id,
            memberId: access.memberId,
            emoji: input.emoji,
          })
          .onConflictDoNothing();
      }

      return { reacted: !removed.length };
    }),

  pin: chatProcedure("chat.post")
    .input(z.object({ messageId: uuid, pinned: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const message = await loadMessage(ctx, input.messageId);
      const access = await channelAccess(ctx, message.channelId);

      if (!access.membership || message.deletedAt) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Join the channel to pin messages.",
        });
      }

      await ctx.db
        .update(chatMessages)
        .set({
          pinnedAt: input.pinned ? new Date() : null,
          pinnedByMemberId: input.pinned ? access.memberId : null,
        })
        .where(eq(chatMessages.id, message.id));

      return { ok: true };
    }),

  pins: chatProcedure("chat.view")
    .input(z.object({ channelId: uuid }))
    .query(async ({ ctx, input }) => {
      const access = await readableChannel(ctx, input.channelId);
      const rows = await ctx.db
        .select()
        .from(chatMessages)
        .where(
          and(
            eq(chatMessages.channelId, input.channelId),
            isNull(chatMessages.deletedAt),
            sql`${chatMessages.pinnedAt} is not null`,
          ),
        )
        .orderBy(desc(chatMessages.pinnedAt));

      return hydrateMessages(ctx, rows, access.memberId);
    }),

  /**
   * Messages matching words, across every conversation the caller may read,
   * narrowed by who wrote them, where, what they carry and when.
   */
  search: chatProcedure("chat.view")
    .input(
      z.object({
        q: z.string().trim().max(200),
        fromMemberId: uuid.optional(),
        channelId: uuid.optional(),
        has: z.enum(["file", "link", "task"]).optional(),
        after: z.coerce.date().optional(),
        before: z.coerce.date().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const memberId = await currentMemberId(ctx);
      const readable = await readableChannelIds(ctx, memberId);
      const channelIds = input.channelId
        ? readable.filter((id) => id === input.channelId)
        : readable;

      if (
        !channelIds.length ||
        (!input.q && !input.fromMemberId && !input.has)
      ) {
        return { results: [], total: 0 };
      }

      const words = input.q.split(/\s+/).filter(Boolean).slice(0, 8);
      const filters: Array<SQL | undefined> = [
        inArray(chatMessages.channelId, channelIds),
        isNull(chatMessages.deletedAt),
        ...words.map((word) =>
          ilike(chatMessages.body, `%${word.replace(/[%_\\]/g, "\\$&")}%`),
        ),
        input.fromMemberId
          ? eq(chatMessages.authorMemberId, input.fromMemberId)
          : undefined,
        input.after ? gte(chatMessages.createdAt, input.after) : undefined,
        input.before ? lte(chatMessages.createdAt, input.before) : undefined,
        input.has === "file"
          ? sql`exists (select 1 from ${chatAttachments} a where a."messageId" = ${chatMessages.id})`
          : input.has === "link"
            ? sql`${chatMessages.body} ~* 'https?://'`
            : input.has === "task"
              ? sql`${chatMessages.body} ~ '\\m[A-Z][A-Z0-9]{1,9}-[0-9]+\\M'`
              : undefined,
      ];
      const rows = await ctx.db
        .select()
        .from(chatMessages)
        .where(and(...filters))
        .orderBy(desc(chatMessages.createdAt))
        .limit(100);
      const channelRows = rows.length
        ? await ctx.db
            .select({
              id: chatChannels.id,
              name: chatChannels.name,
              kind: chatChannels.kind,
            })
            .from(chatChannels)
            .where(
              inArray(
                chatChannels.id,
                rows.map((row) => row.channelId),
              ),
            )
        : [];
      const views = await hydrateMessages(ctx, rows, memberId);

      return {
        total: rows.length,
        results: views.map((view) => {
          const channel = channelRows.find(
            (entry) => entry.id === view.channelId,
          );

          return {
            ...view,
            channel: {
              id: view.channelId,
              name: channel?.name ?? null,
              kind: (channel?.kind ?? "channel") as "channel" | "dm",
            },
          };
        }),
      };
    }),

  /** Messages that mention the caller, newest first, with unread marks. */
  mentions: chatProcedure("chat.view")
    .input(
      z
        .object({ unreadOnly: z.boolean().default(false) })
        .default({ unreadOnly: false }),
    )
    .query(async ({ ctx, input }) => {
      const memberId = await currentMemberId(ctx);
      const rows = await ctx.db
        .select({ message: chatMessages, lastReadAt: chatMembers.lastReadAt })
        .from(chatMessages)
        .innerJoin(
          chatMembers,
          and(
            eq(chatMembers.channelId, chatMessages.channelId),
            eq(chatMembers.memberId, memberId),
          ),
        )
        .where(
          and(
            eq(chatMessages.organizationId, ctx.activeOrganization.id),
            isNull(chatMessages.deletedAt),
            sql`${chatMessages.authorMemberId} is distinct from ${memberId}`,
            or(
              sql`${chatMessages.body} like ${`%<@${memberId}>%`}`,
              sql`${chatMessages.body} ~ '<!(channel|here)>'`,
            ),
            input.unreadOnly
              ? sql`${chatMessages.createdAt} > ${chatMembers.lastReadAt}`
              : undefined,
          ),
        )
        .orderBy(desc(chatMessages.createdAt))
        .limit(100);
      const views = await hydrateMessages(
        ctx,
        rows.map((row) => row.message),
        memberId,
      );
      const channelRows = rows.length
        ? await ctx.db
            .select({ id: chatChannels.id, name: chatChannels.name })
            .from(chatChannels)
            .where(
              inArray(
                chatChannels.id,
                rows.map((row) => row.message.channelId),
              ),
            )
        : [];

      return views.map((view, index) => ({
        ...view,
        unread: rows[index]!.message.createdAt > rows[index]!.lastReadAt,
        channelName:
          channelRows.find((entry) => entry.id === view.channelId)?.name ??
          null,
      }));
    }),

  /** Marks every conversation with an unread mention as read. */
  markMentionsRead: chatProcedure("chat.view").mutation(async ({ ctx }) => {
    const memberId = await currentMemberId(ctx);

    await ctx.db
      .update(chatMembers)
      .set({ lastReadAt: new Date() })
      .where(
        and(
          eq(chatMembers.memberId, memberId),
          sql`exists (select 1 from ${chatMessages} m where m."channelId" = ${chatMembers.channelId} and m."deletedAt" is null and m."createdAt" > ${chatMembers.lastReadAt} and (m.body like ${`%<@${memberId}>%`} or m.body ~ '<!(channel|here)>'))`,
        ),
      );

    return { ok: true };
  }),
};

export { plainBody };
