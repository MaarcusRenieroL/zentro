import { TRPCError } from "@trpc/server";
import { and, eq, inArray, isNull, or, sql } from "@zentro/db/drizzle";
import {
  chatChannels,
  chatMembers,
  chatMessages,
  chatStatuses,
  members,
  sessions,
  users,
} from "@zentro/db/schema";

import type { OrganizationContext } from "./trpc";

export type ChannelAccess = {
  channel: typeof chatChannels.$inferSelect;
  /** The caller's membership, when they are in the conversation. */
  membership: typeof chatMembers.$inferSelect | null;
  memberId: string;
  canRead: boolean;
  canPost: boolean;
  canManage: boolean;
};

/** The caller's member id in the active organization. */
export async function currentMemberId(ctx: OrganizationContext) {
  const [member] = await ctx.db
    .select({ id: members.id })
    .from(members)
    .where(
      and(
        eq(members.userId, ctx.user.id),
        eq(members.organizationId, ctx.activeOrganization.id),
      ),
    )
    .limit(1);

  if (!member) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Member not found." });
  }

  return member.id;
}

/**
 * What the caller may do in a conversation. Public channels can be read by
 * anyone with chat access; private channels and direct messages only by the
 * people in them. Archived channels are read-only.
 */
export async function channelAccess(
  ctx: OrganizationContext,
  channelId: string,
): Promise<ChannelAccess> {
  const memberId = await currentMemberId(ctx);
  const [row] = await ctx.db
    .select({ channel: chatChannels, membership: chatMembers })
    .from(chatChannels)
    .leftJoin(
      chatMembers,
      and(
        eq(chatMembers.channelId, chatChannels.id),
        eq(chatMembers.memberId, memberId),
      ),
    )
    .where(
      and(
        eq(chatChannels.id, channelId),
        eq(chatChannels.organizationId, ctx.activeOrganization.id),
      ),
    )
    .limit(1);

  if (!row) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Channel not found." });
  }

  const { channel, membership } = row;
  const [view, post, manageAny] = await Promise.all([
    ctx.permissions.can("chat.view"),
    ctx.permissions.can("chat.post"),
    ctx.permissions.can("chat.channels.manage"),
  ]);
  const isPublic =
    channel.kind === "channel" && channel.visibility === "public";
  const canRead = view && (Boolean(membership) || isPublic);
  const canManage =
    channel.kind === "channel" &&
    (membership?.role === "admin" || (manageAny && canRead));

  return {
    channel,
    membership,
    memberId,
    canRead,
    canPost: canRead && post && !channel.archivedAt,
    canManage,
  };
}

/** Throws unless the caller may read the conversation. */
export async function readableChannel(
  ctx: OrganizationContext,
  channelId: string,
) {
  const access = await channelAccess(ctx, channelId);

  if (!access.canRead) {
    // A private conversation looks the same as a missing one.
    throw new TRPCError({ code: "NOT_FOUND", message: "Channel not found." });
  }

  return access;
}

/** Ids of every conversation the caller may read: theirs, plus public ones. */
export async function readableChannelIds(
  ctx: OrganizationContext,
  memberId: string,
) {
  if (!(await ctx.permissions.can("chat.view"))) return [];

  const rows = await ctx.db
    .select({ id: chatChannels.id })
    .from(chatChannels)
    .leftJoin(
      chatMembers,
      and(
        eq(chatMembers.channelId, chatChannels.id),
        eq(chatMembers.memberId, memberId),
      ),
    )
    .where(
      and(
        eq(chatChannels.organizationId, ctx.activeOrganization.id),
        or(
          sql`${chatMembers.id} is not null`,
          and(
            eq(chatChannels.kind, "channel"),
            eq(chatChannels.visibility, "public"),
          ),
        ),
      ),
    );

  return rows.map((row) => row.id);
}

/** Members of the organization by id, with name and email. */
export async function memberProfiles(
  ctx: OrganizationContext,
  memberIds: string[],
) {
  if (!memberIds.length) return new Map<string, Profile>();

  const rows = await ctx.db
    .select({
      memberId: members.id,
      userId: users.id,
      name: users.name,
      email: users.email,
    })
    .from(members)
    .innerJoin(users, eq(users.id, members.userId))
    .where(
      and(
        eq(members.organizationId, ctx.activeOrganization.id),
        inArray(members.id, [...new Set(memberIds)]),
      ),
    );
  const presence = await presenceOf(
    ctx,
    rows.map((row) => row.userId),
  );
  const statusRows = await ctx.db
    .select()
    .from(chatStatuses)
    .where(
      inArray(
        chatStatuses.memberId,
        rows.map((row) => row.memberId),
      ),
    );
  const now = Date.now();
  const statusOf = new Map(
    statusRows.map((row) => [
      row.memberId,
      {
        status:
          (row.emoji || row.text) &&
          (!row.expiresAt || row.expiresAt.getTime() > now)
            ? { emoji: row.emoji, text: row.text }
            : null,
        dnd: Boolean(row.dndUntil && row.dndUntil.getTime() > now),
      },
    ]),
  );

  return new Map(
    rows.map((row) => {
      const extra = statusOf.get(row.memberId);

      return [
        row.memberId,
        {
          memberId: row.memberId,
          userId: row.userId,
          name: row.name || row.email,
          email: row.email,
          presence: presence.get(row.userId) ?? "offline",
          status: extra?.status ?? null,
          dnd: extra?.dnd ?? false,
        },
      ];
    }),
  );
}

export type Profile = {
  memberId: string;
  userId: string;
  name: string;
  email: string;
  presence: Presence;
  /** A custom status ("In a meeting"), when one is set and has not expired. */
  status: { emoji: string | null; text: string | null } | null;
  /** Do not disturb: notifications are paused. */
  dnd: boolean;
};

export type Presence = "active" | "away" | "offline";

/** Active within 5 minutes, away within an hour, from session activity. */
export async function presenceOf(
  ctx: OrganizationContext,
  userIds: string[],
): Promise<Map<string, Presence>> {
  if (!userIds.length) return new Map();

  const rows = await ctx.db
    .select({
      userId: sessions.userId,
      at: sql<Date>`max(${sessions.updatedAt})`.mapWith(sessions.updatedAt),
    })
    .from(sessions)
    .where(inArray(sessions.userId, [...new Set(userIds)]))
    .groupBy(sessions.userId);
  const now = Date.now();

  return new Map(
    rows.map((row) => {
      const minutes = (now - new Date(row.at).getTime()) / 60_000;

      return [
        row.userId,
        minutes <= 5 ? "active" : minutes <= 60 ? "away" : "offline",
      ] as const;
    }),
  );
}

// Mentions are stored in the body as <@memberId>, plus <!channel> and
// <!here>, so a rename never breaks one and names can be shown fresh.
const memberMention = /<@([0-9a-f-]{36})>/g;

export function mentionedMemberIds(body: string) {
  return [...new Set([...body.matchAll(memberMention)].map((m) => m[1]!))];
}

export function mentionsEveryone(body: string) {
  return /<!(channel|here)>/.test(body);
}

/** The body with mentions written out as names, for previews and search. */
export function plainBody(body: string, names: Map<string, string>) {
  return body
    .replace(memberMention, (_, id: string) => `@${names.get(id) ?? "someone"}`)
    .replace(/<!(channel|here)>/g, "@$1");
}

/** Lowercase letters, numbers and dashes, as channel names are written. */
export function normalizeChannelName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/^#/, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

/** Conversations that are live (not archived), for lists. */
export const liveChannel = isNull(chatChannels.archivedAt);

/** A message in a conversation the caller can read, or a not-found error. */
export async function readableMessage(
  ctx: OrganizationContext,
  messageId: string,
) {
  const [message] = await ctx.db
    .select({
      id: chatMessages.id,
      channelId: chatMessages.channelId,
      body: chatMessages.body,
    })
    .from(chatMessages)
    .where(
      and(
        eq(chatMessages.id, messageId),
        eq(chatMessages.organizationId, ctx.activeOrganization.id),
        isNull(chatMessages.deletedAt),
      ),
    )
    .limit(1);

  if (!message) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Message not found." });
  }

  await readableChannel(ctx, message.channelId);

  return message;
}
