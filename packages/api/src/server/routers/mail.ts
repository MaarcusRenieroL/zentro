import { randomUUID } from "node:crypto";

import { TRPCError } from "@trpc/server";
import {
  and,
  asc,
  desc,
  eq,
  ilike,
  inArray,
  isNotNull,
  isNull,
  or,
} from "@zentro/db/drizzle";
import {
  mailMessages,
  mailRecipients,
  members,
  users,
} from "@zentro/db/schema";
import { z } from "zod";

import { currentMemberId } from "../chat";
import { permissionProcedure, router, type OrganizationContext } from "../trpc";

const uuid = z.string().uuid();
const folders = ["inbox", "starred", "sent", "drafts", "trash"] as const;

const procedure = (permission: string) =>
  permissionProcedure(permission, undefined, { module: "mail" });

const draftInput = z.object({
  id: uuid.optional(),
  to: z.array(uuid).max(50).default([]),
  cc: z.array(uuid).max(50).default([]),
  subject: z.string().max(300).default(""),
  body: z.string().max(50_000).default(""),
  replyToId: uuid.optional(),
});

type DraftInput = z.infer<typeof draftInput>;

async function nameMap(ctx: OrganizationContext, ids: string[]) {
  if (!ids.length) return new Map<string, { name: string; email: string }>();

  const rows = await ctx.db
    .select({ id: members.id, name: users.name, email: users.email })
    .from(members)
    .innerJoin(users, eq(users.id, members.userId))
    .where(
      and(
        eq(members.organizationId, ctx.activeOrganization.id),
        inArray(members.id, ids),
      ),
    );

  return new Map(rows.map((row) => [row.id, row]));
}

const snippet = (body: string) =>
  body.replace(/\s+/g, " ").trim().slice(0, 140);

/** The message when the caller wrote it or received it once it was sent. */
async function visibleMessage(
  ctx: OrganizationContext,
  memberId: string,
  id: string,
) {
  const [message] = await ctx.db
    .select()
    .from(mailMessages)
    .where(
      and(
        eq(mailMessages.id, id),
        eq(mailMessages.organizationId, ctx.activeOrganization.id),
      ),
    )
    .limit(1);

  if (!message) return null;

  const mine = message.senderMemberId === memberId;
  const recipients = await ctx.db
    .select()
    .from(mailRecipients)
    .where(eq(mailRecipients.messageId, id));
  const asRecipient = recipients.find((row) => row.memberId === memberId);

  if (!mine && !(asRecipient && message.sentAt)) return null;

  return { message, recipients, mine, asRecipient };
}

async function writeMessage(
  ctx: OrganizationContext,
  input: DraftInput,
  send: boolean,
) {
  const memberId = await currentMemberId(ctx);
  const recipientIds = [...new Set([...input.to, ...input.cc])];

  if (recipientIds.length) {
    const known = await nameMap(ctx, recipientIds);

    if (known.size !== recipientIds.length) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Some recipients are not in this organization.",
      });
    }
  }

  if (send && !input.to.length) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Add at least one recipient.",
    });
  }

  if (send && !input.subject.trim() && !input.body.trim()) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Write a subject or a message first.",
    });
  }

  let id = input.id;
  let threadId: string | undefined;

  if (input.replyToId) {
    const original = await visibleMessage(ctx, memberId, input.replyToId);

    if (!original) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Message not found." });
    }

    threadId = original.message.threadId;
  }

  const now = new Date();
  const values = {
    subject: input.subject.trim(),
    body: input.body,
    updatedAt: now,
    ...(send ? { sentAt: now } : {}),
  };

  if (id) {
    const [draft] = await ctx.db
      .select({ id: mailMessages.id })
      .from(mailMessages)
      .where(
        and(
          eq(mailMessages.id, id),
          eq(mailMessages.organizationId, ctx.activeOrganization.id),
          eq(mailMessages.senderMemberId, memberId),
          isNull(mailMessages.sentAt),
        ),
      )
      .limit(1);

    if (!draft) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Draft not found." });
    }

    await ctx.db
      .update(mailMessages)
      .set(values)
      .where(eq(mailMessages.id, id));
    await ctx.db.delete(mailRecipients).where(eq(mailRecipients.messageId, id));
  } else {
    id = randomUUID();
    await ctx.db.insert(mailMessages).values({
      id,
      organizationId: ctx.activeOrganization.id,
      senderMemberId: memberId,
      threadId: threadId ?? id,
      ...values,
    });
  }

  const rows = [
    ...input.to.map((memberIdValue) => ({
      memberId: memberIdValue,
      kind: "to",
    })),
    ...input.cc
      .filter((value) => !input.to.includes(value))
      .map((memberIdValue) => ({ memberId: memberIdValue, kind: "cc" })),
  ];

  if (rows.length) {
    await ctx.db
      .insert(mailRecipients)
      .values(rows.map((row) => ({ ...row, messageId: id! })));
  }

  return { id };
}

export const mailRouter = router({
  /** Messages in a folder, newest first. */
  list: procedure("mail.view")
    .input(
      z.object({
        folder: z.enum(folders),
        search: z.string().trim().max(120).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const memberId = await currentMemberId(ctx);
      const escaped = input.search?.replace(/[\\%_]/g, "\\$&");
      const match = escaped
        ? or(
            ilike(mailMessages.subject, `%${escaped}%`),
            ilike(mailMessages.body, `%${escaped}%`),
          )
        : undefined;
      const org = eq(mailMessages.organizationId, ctx.activeOrganization.id);

      type Item = {
        id: string;
        threadId: string;
        subject: string;
        snippet: string;
        senderId: string | null;
        toIds: string[];
        at: Date;
        unread: boolean;
        starred: boolean;
      };
      const items = new Map<string, Item>();
      const wantsReceived = ["inbox", "starred", "trash"].includes(
        input.folder,
      );
      const wantsSent = ["sent", "drafts", "starred", "trash"].includes(
        input.folder,
      );

      if (wantsReceived) {
        const rows = await ctx.db
          .select({ message: mailMessages, rec: mailRecipients })
          .from(mailRecipients)
          .innerJoin(
            mailMessages,
            eq(mailMessages.id, mailRecipients.messageId),
          )
          .where(
            and(
              org,
              match,
              eq(mailRecipients.memberId, memberId),
              isNotNull(mailMessages.sentAt),
              isNull(mailRecipients.purgedAt),
              input.folder === "trash"
                ? isNotNull(mailRecipients.trashedAt)
                : isNull(mailRecipients.trashedAt),
              input.folder === "starred"
                ? eq(mailRecipients.starred, true)
                : undefined,
            ),
          )
          .orderBy(desc(mailMessages.sentAt))
          .limit(300);

        for (const { message, rec } of rows) {
          items.set(message.id, {
            id: message.id,
            threadId: message.threadId,
            subject: message.subject,
            snippet: snippet(message.body),
            senderId: message.senderMemberId,
            toIds: [],
            at: message.sentAt!,
            unread: !rec.readAt,
            starred: rec.starred,
          });
        }
      }

      if (wantsSent) {
        const rows = await ctx.db
          .select()
          .from(mailMessages)
          .where(
            and(
              org,
              match,
              eq(mailMessages.senderMemberId, memberId),
              isNull(mailMessages.senderPurgedAt),
              input.folder === "drafts"
                ? and(
                    isNull(mailMessages.sentAt),
                    isNull(mailMessages.senderTrashedAt),
                  )
                : isNotNull(mailMessages.sentAt),
              input.folder === "trash"
                ? isNotNull(mailMessages.senderTrashedAt)
                : isNull(mailMessages.senderTrashedAt),
              input.folder === "starred"
                ? eq(mailMessages.senderStarred, true)
                : undefined,
            ),
          )
          .orderBy(desc(mailMessages.updatedAt))
          .limit(300);

        for (const message of rows) {
          if (items.has(message.id)) continue;
          items.set(message.id, {
            id: message.id,
            threadId: message.threadId,
            subject: message.subject,
            snippet: snippet(message.body),
            senderId: message.senderMemberId,
            toIds: [],
            at: message.sentAt ?? message.updatedAt,
            unread: false,
            starred: message.senderStarred,
          });
        }
      }

      const list = [...items.values()].sort((a, b) => +b.at - +a.at);
      const recipients = list.length
        ? await ctx.db
            .select({
              messageId: mailRecipients.messageId,
              memberId: mailRecipients.memberId,
              kind: mailRecipients.kind,
            })
            .from(mailRecipients)
            .where(
              inArray(
                mailRecipients.messageId,
                list.map((item) => item.id),
              ),
            )
        : [];

      for (const row of recipients) {
        if (row.kind === "to")
          items.get(row.messageId)?.toIds.push(row.memberId);
      }

      const names = await nameMap(ctx, [
        ...new Set(
          list.flatMap((item) => [
            ...(item.senderId ? [item.senderId] : []),
            ...item.toIds,
          ]),
        ),
      ]);
      const label = (id: string | null) =>
        (id && names.get(id)?.name) || "Someone";

      return list.map((item) => ({
        id: item.id,
        threadId: item.threadId,
        subject: item.subject || "(no subject)",
        snippet: item.snippet,
        from: item.senderId === memberId ? "Me" : label(item.senderId),
        to: item.toIds.map(label),
        at: item.at.toISOString(),
        unread: item.unread,
        starred: item.starred,
        draft: input.folder === "drafts",
      }));
    }),

  /** How many unread messages are waiting in the inbox. */
  unread: procedure("mail.view").query(async ({ ctx }) => {
    const memberId = await currentMemberId(ctx);
    const rows = await ctx.db
      .select({ id: mailRecipients.id })
      .from(mailRecipients)
      .innerJoin(mailMessages, eq(mailMessages.id, mailRecipients.messageId))
      .where(
        and(
          eq(mailRecipients.memberId, memberId),
          eq(mailMessages.organizationId, ctx.activeOrganization.id),
          isNull(mailRecipients.readAt),
          isNull(mailRecipients.trashedAt),
          isNull(mailRecipients.purgedAt),
          isNotNull(mailMessages.sentAt),
        ),
      );

    return { count: rows.length };
  }),

  /** People who can be addressed. */
  people: procedure("mail.view").query(async ({ ctx }) => {
    const memberId = await currentMemberId(ctx);
    const rows = await ctx.db
      .select({ id: members.id, name: users.name, email: users.email })
      .from(members)
      .innerJoin(users, eq(users.id, members.userId))
      .where(eq(members.organizationId, ctx.activeOrganization.id))
      .orderBy(asc(users.name));

    return rows.map((row) => ({ ...row, isMe: row.id === memberId }));
  }),

  /** One conversation as the caller can see it; marks it read. */
  get: procedure("mail.view")
    .input(z.object({ id: uuid }))
    .query(async ({ ctx, input }) => {
      const memberId = await currentMemberId(ctx);
      const first = await visibleMessage(ctx, memberId, input.id);

      if (!first) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Message not found.",
        });
      }

      const thread = await ctx.db
        .select({ id: mailMessages.id })
        .from(mailMessages)
        .where(
          and(
            eq(mailMessages.threadId, first.message.threadId),
            eq(mailMessages.organizationId, ctx.activeOrganization.id),
          ),
        );
      const messages = (
        await Promise.all(
          thread.map((row) => visibleMessage(ctx, memberId, row.id)),
        )
      )
        .filter((item) => item !== null)
        .filter((item) => item.message.sentAt || item.message.id === input.id)
        .sort(
          (a, b) =>
            +(a.message.sentAt ?? a.message.updatedAt) -
            +(b.message.sentAt ?? b.message.updatedAt),
        );

      const unreadIds = messages
        .filter((item) => item.asRecipient && !item.asRecipient.readAt)
        .map((item) => item.asRecipient!.id);

      if (unreadIds.length) {
        await ctx.db
          .update(mailRecipients)
          .set({ readAt: new Date() })
          .where(inArray(mailRecipients.id, unreadIds));
      }

      const names = await nameMap(ctx, [
        ...new Set(
          messages.flatMap((item) => [
            ...(item.message.senderMemberId
              ? [item.message.senderMemberId]
              : []),
            ...item.recipients.map((row) => row.memberId),
          ]),
        ),
      ]);
      const person = (id: string) => ({
        id,
        name: names.get(id)?.name ?? "Someone",
        email: names.get(id)?.email ?? "",
      });

      return {
        subject: first.message.subject || "(no subject)",
        messages: messages.map((item) => ({
          id: item.message.id,
          from: item.message.senderMemberId
            ? person(item.message.senderMemberId)
            : { id: "", name: "Someone", email: "" },
          to: item.recipients
            .filter((row) => row.kind === "to")
            .map((row) => person(row.memberId)),
          cc: item.recipients
            .filter((row) => row.kind === "cc")
            .map((row) => person(row.memberId)),
          subject: item.message.subject,
          body: item.message.body,
          at: (item.message.sentAt ?? item.message.updatedAt).toISOString(),
          draft: !item.message.sentAt,
          mine: item.mine,
        })),
      };
    }),

  saveDraft: procedure("mail.send")
    .input(draftInput)
    .mutation(({ ctx, input }) => writeMessage(ctx, input, false)),

  send: procedure("mail.send")
    .input(draftInput)
    .mutation(({ ctx, input }) => writeMessage(ctx, input, true)),

  /** Marks messages read or unread, starred, or trashed and restored. */
  update: procedure("mail.view")
    .input(
      z.object({
        ids: z.array(uuid).min(1).max(100),
        read: z.boolean().optional(),
        starred: z.boolean().optional(),
        trashed: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const memberId = await currentMemberId(ctx);
      const now = new Date();

      await ctx.db
        .update(mailRecipients)
        .set({
          ...(input.read === undefined
            ? {}
            : { readAt: input.read ? now : null }),
          ...(input.starred === undefined ? {} : { starred: input.starred }),
          ...(input.trashed === undefined
            ? {}
            : { trashedAt: input.trashed ? now : null }),
        })
        .where(
          and(
            eq(mailRecipients.memberId, memberId),
            inArray(mailRecipients.messageId, input.ids),
          ),
        );

      if (input.starred !== undefined || input.trashed !== undefined) {
        await ctx.db
          .update(mailMessages)
          .set({
            ...(input.starred === undefined
              ? {}
              : { senderStarred: input.starred }),
            ...(input.trashed === undefined
              ? {}
              : { senderTrashedAt: input.trashed ? now : null }),
          })
          .where(
            and(
              eq(mailMessages.senderMemberId, memberId),
              eq(mailMessages.organizationId, ctx.activeOrganization.id),
              inArray(mailMessages.id, input.ids),
            ),
          );
      }

      return { ok: true };
    }),

  /** Removes trashed messages for good (drafts are deleted outright). */
  purge: procedure("mail.view")
    .input(z.object({ ids: z.array(uuid).min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      const memberId = await currentMemberId(ctx);
      const now = new Date();

      await ctx.db
        .delete(mailMessages)
        .where(
          and(
            eq(mailMessages.senderMemberId, memberId),
            eq(mailMessages.organizationId, ctx.activeOrganization.id),
            isNull(mailMessages.sentAt),
            inArray(mailMessages.id, input.ids),
          ),
        );
      await ctx.db
        .update(mailRecipients)
        .set({ purgedAt: now })
        .where(
          and(
            eq(mailRecipients.memberId, memberId),
            isNotNull(mailRecipients.trashedAt),
            inArray(mailRecipients.messageId, input.ids),
          ),
        );
      await ctx.db
        .update(mailMessages)
        .set({ senderPurgedAt: now })
        .where(
          and(
            eq(mailMessages.senderMemberId, memberId),
            eq(mailMessages.organizationId, ctx.activeOrganization.id),
            isNotNull(mailMessages.senderTrashedAt),
            inArray(mailMessages.id, input.ids),
          ),
        );

      return { ok: true };
    }),
});
