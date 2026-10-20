import { TRPCError } from "@trpc/server";
import {
  and,
  asc,
  desc,
  eq,
  inArray,
  isNull,
  ne,
  sql,
} from "@zentro/db/drizzle";
import {
  chatChannels,
  chatMembers,
  chatMessages,
  members,
  projects,
  teams,
} from "@zentro/db/schema";
import { z } from "zod";

import {
  channelAccess,
  currentMemberId,
  memberProfiles,
  normalizeChannelName,
  readableChannel,
} from "../chat";
import { loadProjectById } from "../resources";
import {
  denialFor,
  permissionProcedure,
  type OrganizationContext,
} from "../trpc";

const uuid = z.string().uuid();
const channelName = z
  .string()
  .trim()
  .min(1, "Give the channel a name.")
  .max(80, "Keep the name under 80 characters.")
  .transform(normalizeChannelName)
  .refine((name) => name.length >= 2, "Use at least 2 letters or numbers.")
  .refine(
    (name) => !["mentions", "search", "dm", "new", "browse"].includes(name),
    "That name is reserved.",
  );
const link = z
  .object({ type: z.enum(["team", "project"]), id: uuid })
  .nullable();

const chatProcedure = (
  permission: string,
  options: { audit?: string[]; also?: string[] } = {},
) => permissionProcedure(permission, undefined, { module: "chat", ...options });

/** Team or project a channel is linked to, checked against the caller. */
async function resolveLink(
  ctx: OrganizationContext,
  value: { type: "team" | "project"; id: string } | null | undefined,
) {
  if (!value) return null;

  if (value.type === "project") {
    const project = await loadProjectById(ctx, value.id);

    if (!project) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Project not found." });
    }

    const decision = await ctx.permissions.check("projects.view", { project });

    if (!decision.allowed) throw denialFor(decision);

    return value;
  }

  const [team] = await ctx.db
    .select({ id: teams.id })
    .from(teams)
    .where(
      and(
        eq(teams.id, value.id),
        eq(teams.organizationId, ctx.activeOrganization.id),
      ),
    )
    .limit(1);

  if (!team) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Team not found." });
  }

  return value;
}

/** Names and keys of the teams and projects channels are linked to. */
async function linkLabels(
  ctx: OrganizationContext,
  rows: Array<{ linkType: string | null; linkId: string | null }>,
) {
  const projectIds = rows
    .filter((row) => row.linkType === "project" && row.linkId)
    .map((row) => row.linkId!);
  const teamIds = rows
    .filter((row) => row.linkType === "team" && row.linkId)
    .map((row) => row.linkId!);
  const [projectRows, teamRows] = await Promise.all([
    projectIds.length
      ? ctx.db
          .select({
            id: projects.id,
            name: projects.name,
            key: projects.taskKeyPrefix,
            slug: projects.slug,
          })
          .from(projects)
          .where(inArray(projects.id, projectIds))
      : [],
    teamIds.length
      ? ctx.db
          .select({ id: teams.id, name: teams.name })
          .from(teams)
          .where(inArray(teams.id, teamIds))
      : [],
  ]);

  return (linkType: string | null, linkId: string | null) => {
    if (linkType === "project") {
      const project = projectRows.find((entry) => entry.id === linkId);

      return project
        ? {
            type: "project" as const,
            id: project.id,
            name: project.name,
            key: project.key,
            href: `/projects/${project.slug}`,
          }
        : null;
    }

    if (linkType === "team") {
      const team = teamRows.find((entry) => entry.id === linkId);

      return team
        ? {
            type: "team" as const,
            id: team.id,
            name: team.name,
            key: null,
            href: `/settings/organization/teams/${team.id}`,
          }
        : null;
    }

    return null;
  };
}

async function addMembers(
  ctx: OrganizationContext,
  channelId: string,
  memberIds: string[],
  role: "admin" | "member" = "member",
) {
  if (!memberIds.length) return [];

  // Only people in this organization can be added.
  const valid = await memberProfiles(ctx, memberIds);

  if (!valid.size) return [];

  return ctx.db
    .insert(chatMembers)
    .values(
      [...valid.keys()].map((memberId) => ({ channelId, memberId, role })),
    )
    .onConflictDoNothing()
    .returning({ memberId: chatMembers.memberId });
}

/** Turns "Arjun, Sana and Diego" style DM titles out of the other people. */
function dmTitle(names: string[]) {
  if (!names.length) return "Just you";
  if (names.length <= 3) return names.join(", ");

  return `${names.slice(0, 2).join(", ")} and ${names.length - 2} more`;
}

export const chatChannelProcedures = {
  /**
   * The caller's conversations for the chat sidebar, with unread counts.
   * A muted conversation still counts, but never shows as a mention badge.
   */
  sidebar: chatProcedure("chat.view").query(async ({ ctx }) => {
    const memberId = await currentMemberId(ctx);
    const mine = await ctx.db
      .select({ channel: chatChannels, membership: chatMembers })
      .from(chatMembers)
      .innerJoin(chatChannels, eq(chatChannels.id, chatMembers.channelId))
      .where(
        and(
          eq(chatMembers.memberId, memberId),
          eq(chatChannels.organizationId, ctx.activeOrganization.id),
        ),
      )
      .orderBy(asc(chatChannels.name));

    if (!mine.length) return { channels: [], totalUnread: 0 };

    const channelIds = mine.map((row) => row.channel.id);
    const counts = await ctx.db
      .select({
        channelId: chatMessages.channelId,
        unread: sql<number>`count(*)`.mapWith(Number),
        mentions:
          sql<number>`count(*) filter (where ${chatMessages.body} like ${`%<@${memberId}>%`} or ${chatMessages.body} ~ '<!(channel|here)>')`.mapWith(
            Number,
          ),
      })
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
          inArray(chatMessages.channelId, channelIds),
          isNull(chatMessages.deletedAt),
          isNull(chatMessages.parentId),
          sql`${chatMessages.createdAt} > ${chatMembers.lastReadAt}`,
          sql`${chatMessages.authorMemberId} is distinct from ${memberId}`,
        ),
      )
      .groupBy(chatMessages.channelId);

    // Who is in each DM, to name it and show presence.
    const dmIds = mine
      .filter((row) => row.channel.kind === "dm")
      .map((row) => row.channel.id);
    const dmRows = dmIds.length
      ? await ctx.db
          .select({
            channelId: chatMembers.channelId,
            memberId: chatMembers.memberId,
          })
          .from(chatMembers)
          .where(
            and(
              inArray(chatMembers.channelId, dmIds),
              ne(chatMembers.memberId, memberId),
            ),
          )
      : [];
    const profiles = await memberProfiles(
      ctx,
      dmRows.map((row) => row.memberId),
    );
    const labelOf = await linkLabels(
      ctx,
      mine.map((row) => row.channel),
    );
    let totalUnread = 0;

    const channels = mine.map(({ channel, membership }) => {
      const count = counts.find((row) => row.channelId === channel.id);
      const muted =
        membership.notify === "mute" ||
        Boolean(membership.mutedUntil && membership.mutedUntil > new Date());
      const others = dmRows
        .filter((row) => row.channelId === channel.id)
        .map((row) => profiles.get(row.memberId))
        .filter((profile) => profile !== undefined);
      const unread = count?.unread ?? 0;
      const mentions = muted ? 0 : (count?.mentions ?? 0);

      if (!muted && !channel.archivedAt) {
        totalUnread += channel.kind === "dm" ? unread : mentions || 0;
      }

      return {
        id: channel.id,
        kind: channel.kind as "channel" | "dm",
        name: channel.name,
        title:
          channel.kind === "dm"
            ? dmTitle(others.map((other) => other.name))
            : (channel.name ?? ""),
        topic: channel.topic,
        visibility: channel.visibility as "public" | "private",
        link: labelOf(channel.linkType, channel.linkId),
        archived: Boolean(channel.archivedAt),
        pinned: membership.pinned,
        notify: membership.notify as "all" | "mentions" | "mute",
        muted,
        unread,
        // DMs are always about you, so every unread one counts as a mention.
        mentions: channel.kind === "dm" && !muted ? unread : mentions,
        lastMessageAt: channel.lastMessageAt,
        people: others,
      };
    });

    return { channels, totalUnread };
  }),

  /** Public channels the caller is not in, to browse and join. */
  browse: chatProcedure("chat.view").query(async ({ ctx }) => {
    const memberId = await currentMemberId(ctx);
    const rows = await ctx.db
      .select({
        id: chatChannels.id,
        name: chatChannels.name,
        topic: chatChannels.topic,
        linkType: chatChannels.linkType,
        linkId: chatChannels.linkId,
        members:
          sql<number>`(select count(*) from ${chatMembers} m where m."channelId" = ${chatChannels.id})`.mapWith(
            Number,
          ),
      })
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
          eq(chatChannels.kind, "channel"),
          eq(chatChannels.visibility, "public"),
          isNull(chatChannels.archivedAt),
          isNull(chatMembers.id),
        ),
      )
      .orderBy(asc(chatChannels.name));
    const labelOf = await linkLabels(ctx, rows);

    return rows.map((row) => ({
      id: row.id,
      name: row.name ?? "",
      topic: row.topic,
      members: row.members,
      link: labelOf(row.linkType, row.linkId),
    }));
  }),

  /**
   * One conversation by name (channels) or id (DMs). A private channel the
   * caller is not in answers with who can add them, so they can ask.
   */
  get: chatProcedure("chat.view")
    .input(
      z.object({ name: z.string().max(80).optional(), id: uuid.optional() }),
    )
    .query(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .select({ id: chatChannels.id })
        .from(chatChannels)
        .where(
          and(
            eq(chatChannels.organizationId, ctx.activeOrganization.id),
            input.id
              ? eq(chatChannels.id, input.id)
              : eq(chatChannels.name, normalizeChannelName(input.name ?? "")),
          ),
        )
        .limit(1);

      if (!row) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Channel not found.",
        });
      }

      const access = await channelAccess(ctx, row.id);
      const { channel } = access;
      const memberRows = await ctx.db
        .select({
          memberId: chatMembers.memberId,
          role: chatMembers.role,
        })
        .from(chatMembers)
        .where(eq(chatMembers.channelId, channel.id))
        .orderBy(asc(chatMembers.joinedAt));
      const profiles = await memberProfiles(
        ctx,
        memberRows.map((entry) => entry.memberId),
      );
      const people = memberRows
        .map((entry) => ({
          ...profiles.get(entry.memberId)!,
          role: entry.role,
        }))
        .filter((entry) => entry.memberId);

      if (!access.canRead) {
        // A private channel's name is known to whoever has its link; who
        // can let them in is all they learn.
        if (channel.kind !== "channel") {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Channel not found.",
          });
        }

        return {
          access: "none" as const,
          id: channel.id,
          name: channel.name ?? "",
          visibility: channel.visibility,
          admins: people
            .filter((entry) => entry.role === "admin")
            .map(({ memberId, name }) => ({ memberId, name })),
        };
      }

      const labelOf = await linkLabels(ctx, [channel]);
      const pins = await ctx.db
        .select({ count: sql<number>`count(*)`.mapWith(Number) })
        .from(chatMessages)
        .where(
          and(
            eq(chatMessages.channelId, channel.id),
            isNull(chatMessages.deletedAt),
            sql`${chatMessages.pinnedAt} is not null`,
          ),
        );
      const others = people.filter(
        (entry) => entry.memberId !== access.memberId,
      );

      return {
        access: "full" as const,
        id: channel.id,
        kind: channel.kind as "channel" | "dm",
        name: channel.name ?? "",
        title:
          channel.kind === "dm"
            ? dmTitle(others.map((entry) => entry.name))
            : (channel.name ?? ""),
        topic: channel.topic,
        description: channel.description,
        visibility: channel.visibility as "public" | "private",
        link: labelOf(channel.linkType, channel.linkId),
        archivedAt: channel.archivedAt,
        createdAt: channel.createdAt,
        createdByMemberId: channel.createdByMemberId,
        people,
        pinCount: pins[0]?.count ?? 0,
        joined: Boolean(access.membership),
        role: access.membership?.role ?? null,
        notify: access.membership?.notify ?? "all",
        notifyReplies: access.membership?.notifyReplies ?? true,
        mutedUntil: access.membership?.mutedUntil ?? null,
        pinned: access.membership?.pinned ?? false,
        lastReadAt: access.membership?.lastReadAt ?? null,
        canPost: access.canPost,
        canManage: access.canManage,
      };
    }),

  create: chatProcedure("chat.channels.create", {
    audit: ["chat.channel_created", "chat.member_added"],
    also: ["projects.view"],
  })
    .input(
      z.object({
        name: channelName,
        topic: z.string().trim().max(250).optional(),
        visibility: z.enum(["public", "private"]).default("public"),
        link: link.optional(),
        memberIds: z.array(uuid).max(200).default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const memberId = await currentMemberId(ctx);
      const linkValue = await resolveLink(ctx, input.link);
      const [taken] = await ctx.db
        .select({ id: chatChannels.id })
        .from(chatChannels)
        .where(
          and(
            eq(chatChannels.organizationId, ctx.activeOrganization.id),
            eq(chatChannels.name, input.name),
          ),
        )
        .limit(1);

      if (taken) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `#${input.name} already exists. Pick another name.`,
        });
      }

      const channel = await ctx.db.transaction(async (tx) => {
        const [row] = await tx
          .insert(chatChannels)
          .values({
            organizationId: ctx.activeOrganization.id,
            kind: "channel",
            name: input.name,
            topic: input.topic || null,
            visibility: input.visibility,
            linkType: linkValue?.type ?? null,
            linkId: linkValue?.id ?? null,
            createdByMemberId: memberId,
          })
          .returning();

        // The creator runs the channel.
        await tx.insert(chatMembers).values({
          channelId: row!.id,
          memberId,
          role: "admin",
        });
        await ctx.audit.record(tx, {
          action: "chat.channel_created",
          target: { id: row!.id, label: `#${row!.name}` },
          metadata: {
            visibility: row!.visibility,
            ...(linkValue ? { link: linkValue.type } : {}),
          },
        });

        return row!;
      });
      const added = await addMembers(
        ctx,
        channel.id,
        input.memberIds.filter((id) => id !== memberId),
      );

      if (added.length) {
        await ctx.audit.record(ctx.db, {
          action: "chat.member_added",
          target: { id: channel.id, label: `#${channel.name}` },
          metadata: { count: added.length },
        });
      } else {
        ctx.audit.skipped("chat.member_added");
      }

      return { id: channel.id, name: channel.name! };
    }),

  update: chatProcedure("chat.view", {
    audit: ["chat.channel_updated"],
    also: ["chat.channels.manage", "projects.view"],
  })
    .input(
      z.object({
        channelId: uuid,
        name: channelName.optional(),
        topic: z.string().trim().max(250).nullable().optional(),
        description: z.string().trim().max(2000).nullable().optional(),
        visibility: z.enum(["public", "private"]).optional(),
        link: link.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const access = await channelAccess(ctx, input.channelId);

      if (!access.canManage) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only channel admins can change this channel.",
        });
      }

      const values: Partial<typeof chatChannels.$inferInsert> = {
        updatedAt: new Date(),
      };
      const fields: string[] = [];

      if (input.name !== undefined && input.name !== access.channel.name) {
        const [taken] = await ctx.db
          .select({ id: chatChannels.id })
          .from(chatChannels)
          .where(
            and(
              eq(chatChannels.organizationId, ctx.activeOrganization.id),
              eq(chatChannels.name, input.name),
            ),
          )
          .limit(1);

        if (taken) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `#${input.name} already exists. Pick another name.`,
          });
        }

        values.name = input.name;
        fields.push("name");
      }

      if (input.topic !== undefined) {
        values.topic = input.topic || null;
        fields.push("topic");
      }

      if (input.description !== undefined) {
        values.description = input.description || null;
        fields.push("description");
      }

      if (input.visibility !== undefined) {
        values.visibility = input.visibility;
        fields.push("visibility");
      }

      if (input.link !== undefined) {
        const linkValue = await resolveLink(ctx, input.link);

        values.linkType = linkValue?.type ?? null;
        values.linkId = linkValue?.id ?? null;
        fields.push("link");
      }

      if (!fields.length) {
        ctx.audit.skipped("chat.channel_updated");

        return { ok: true };
      }

      await ctx.db.transaction(async (tx) => {
        await tx
          .update(chatChannels)
          .set(values)
          .where(eq(chatChannels.id, input.channelId));
        await ctx.audit.record(tx, {
          action: "chat.channel_updated",
          target: {
            id: input.channelId,
            label: `#${values.name ?? access.channel.name}`,
          },
          metadata: { fields },
        });
      });

      return { ok: true };
    }),

  archive: chatProcedure("chat.view", {
    audit: ["chat.channel_archived", "chat.channel_unarchived"],
    also: ["chat.channels.manage"],
  })
    .input(z.object({ channelId: uuid, archived: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const access = await channelAccess(ctx, input.channelId);

      if (!access.canManage) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only channel admins can archive this channel.",
        });
      }

      await ctx.db.transaction(async (tx) => {
        await tx
          .update(chatChannels)
          .set({ archivedAt: input.archived ? new Date() : null })
          .where(eq(chatChannels.id, input.channelId));
        await ctx.audit.record(tx, {
          action: input.archived
            ? "chat.channel_archived"
            : "chat.channel_unarchived",
          target: { id: input.channelId, label: `#${access.channel.name}` },
        });
      });
      return { ok: true };
    }),

  addMembers: chatProcedure("chat.view", {
    audit: ["chat.member_added"],
    also: ["chat.channels.manage"],
  })
    .input(
      z.object({ channelId: uuid, memberIds: z.array(uuid).min(1).max(200) }),
    )
    .mutation(async ({ ctx, input }) => {
      const access = await channelAccess(ctx, input.channelId);
      // Anyone in a public channel may bring people in; private channels
      // are up to their admins.
      const allowed =
        access.canManage ||
        (access.membership && access.channel.visibility === "public");

      if (!allowed || access.channel.kind !== "channel") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only channel admins can add people here.",
        });
      }

      const added = await addMembers(ctx, input.channelId, input.memberIds);

      if (added.length) {
        await ctx.audit.record(ctx.db, {
          action: "chat.member_added",
          target: { id: input.channelId, label: `#${access.channel.name}` },
          metadata: { count: added.length },
        });
      } else {
        ctx.audit.skipped("chat.member_added");
      }

      return { added: added.length };
    }),

  removeMember: chatProcedure("chat.view", {
    audit: ["chat.member_removed"],
    also: ["chat.channels.manage"],
  })
    .input(z.object({ channelId: uuid, memberId: uuid }))
    .mutation(async ({ ctx, input }) => {
      const access = await channelAccess(ctx, input.channelId);
      const self = input.memberId === access.memberId;

      if (access.channel.kind !== "channel" || (!self && !access.canManage)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only channel admins can remove people.",
        });
      }

      // A channel always keeps someone to run it.
      const admins = await ctx.db
        .select({ memberId: chatMembers.memberId })
        .from(chatMembers)
        .where(
          and(
            eq(chatMembers.channelId, input.channelId),
            eq(chatMembers.role, "admin"),
          ),
        );

      if (
        admins.length === 1 &&
        admins[0]!.memberId === input.memberId &&
        access.channel.visibility === "private"
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Make someone else a channel admin first.",
        });
      }

      await ctx.db
        .delete(chatMembers)
        .where(
          and(
            eq(chatMembers.channelId, input.channelId),
            eq(chatMembers.memberId, input.memberId),
          ),
        );
      await ctx.audit.record(ctx.db, {
        action: "chat.member_removed",
        target: { id: input.channelId, label: `#${access.channel.name}` },
        metadata: { left: self },
      });

      return { ok: true };
    }),

  setRole: chatProcedure("chat.view", {
    audit: ["chat.member_role_changed"],
    also: ["chat.channels.manage"],
  })
    .input(
      z.object({
        channelId: uuid,
        memberId: uuid,
        role: z.enum(["admin", "member"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const access = await channelAccess(ctx, input.channelId);

      if (!access.canManage) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only channel admins can change roles.",
        });
      }

      if (input.role === "member") {
        const admins = await ctx.db
          .select({ memberId: chatMembers.memberId })
          .from(chatMembers)
          .where(
            and(
              eq(chatMembers.channelId, input.channelId),
              eq(chatMembers.role, "admin"),
            ),
          );

        if (admins.length === 1 && admins[0]!.memberId === input.memberId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "A channel needs at least one admin.",
          });
        }
      }

      const updated = await ctx.db
        .update(chatMembers)
        .set({ role: input.role })
        .where(
          and(
            eq(chatMembers.channelId, input.channelId),
            eq(chatMembers.memberId, input.memberId),
          ),
        )
        .returning({ id: chatMembers.id });

      if (!updated.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "They aren't in this channel.",
        });
      }

      await ctx.audit.record(ctx.db, {
        action: "chat.member_role_changed",
        target: { id: input.channelId, label: `#${access.channel.name}` },
        metadata: { role: input.role },
      });

      return { ok: true };
    }),

  join: chatProcedure("chat.view", { audit: ["chat.member_added"] })
    .input(z.object({ channelId: uuid }))
    .mutation(async ({ ctx, input }) => {
      const access = await readableChannel(ctx, input.channelId);

      if (access.membership) {
        ctx.audit.skipped("chat.member_added");

        return { ok: true };
      }

      await ctx.db
        .insert(chatMembers)
        .values({ channelId: input.channelId, memberId: access.memberId })
        .onConflictDoNothing();
      await ctx.audit.record(ctx.db, {
        action: "chat.member_added",
        target: { id: input.channelId, label: `#${access.channel.name}` },
        metadata: { joined: true },
      });

      return { ok: true };
    }),

  /** The caller's own settings for a conversation. */
  setPreferences: chatProcedure("chat.view")
    .input(
      z.object({
        channelId: uuid,
        notify: z.enum(["all", "mentions", "mute"]).optional(),
        notifyReplies: z.boolean().optional(),
        mutedUntil: z.coerce.date().nullable().optional(),
        pinned: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { channelId, ...values } = input;
      const memberId = await currentMemberId(ctx);
      const updated = await ctx.db
        .update(chatMembers)
        .set(values)
        .where(
          and(
            eq(chatMembers.channelId, channelId),
            eq(chatMembers.memberId, memberId),
          ),
        )
        .returning({ id: chatMembers.id });

      if (!updated.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Join the channel first.",
        });
      }

      return { ok: true };
    }),

  markRead: chatProcedure("chat.view")
    .input(z.object({ channelId: uuid }))
    .mutation(async ({ ctx, input }) => {
      const memberId = await currentMemberId(ctx);

      await ctx.db
        .update(chatMembers)
        .set({ lastReadAt: new Date() })
        .where(
          and(
            eq(chatMembers.channelId, input.channelId),
            eq(chatMembers.memberId, memberId),
          ),
        );

      return { ok: true };
    }),

  /** A direct message with these people, reusing one that already exists. */
  openDm: chatProcedure("chat.post")
    .input(z.object({ memberIds: z.array(uuid).min(1).max(8) }))
    .mutation(async ({ ctx, input }) => {
      const memberId = await currentMemberId(ctx);
      const profiles = await memberProfiles(ctx, input.memberIds);
      const everyone = [...new Set([memberId, ...[...profiles.keys()]])].sort();

      if (everyone.length < 2) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Pick someone to message.",
        });
      }

      // A DM is found by exactly its people.
      const candidates = await ctx.db
        .select({
          id: chatChannels.id,
          people: sql<
            string[]
          >`array_agg(${chatMembers.memberId}::text order by ${chatMembers.memberId})`,
        })
        .from(chatChannels)
        .innerJoin(chatMembers, eq(chatMembers.channelId, chatChannels.id))
        .where(
          and(
            eq(chatChannels.organizationId, ctx.activeOrganization.id),
            eq(chatChannels.kind, "dm"),
          ),
        )
        .groupBy(chatChannels.id);
      const existing = candidates.find(
        (row) => row.people.join(",") === everyone.join(","),
      );

      if (existing) return { id: existing.id };

      const channel = await ctx.db.transaction(async (tx) => {
        const [row] = await tx
          .insert(chatChannels)
          .values({
            organizationId: ctx.activeOrganization.id,
            kind: "dm",
            visibility: "private",
            createdByMemberId: memberId,
          })
          .returning({ id: chatChannels.id });

        await tx
          .insert(chatMembers)
          .values(everyone.map((id) => ({ channelId: row!.id, memberId: id })));

        return row!;
      });

      return { id: channel.id };
    }),

  /**
   * Asks a private channel's admin to add the caller, as a direct message
   * from the caller with a link back to the channel.
   */
  requestAccess: chatProcedure("chat.post")
    .input(z.object({ channelId: uuid }))
    .mutation(async ({ ctx, input }) => {
      const access = await channelAccess(ctx, input.channelId);

      if (access.canRead || access.channel.kind !== "channel") {
        return { ok: true, adminName: null };
      }

      const [admin] = await ctx.db
        .select({ memberId: chatMembers.memberId })
        .from(chatMembers)
        .where(
          and(
            eq(chatMembers.channelId, input.channelId),
            eq(chatMembers.role, "admin"),
          ),
        )
        .orderBy(asc(chatMembers.joinedAt))
        .limit(1);

      if (!admin) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Nobody can add you to this channel right now.",
        });
      }

      const everyone = [access.memberId, admin.memberId].sort();
      const candidates = await ctx.db
        .select({
          id: chatChannels.id,
          people: sql<
            string[]
          >`array_agg(${chatMembers.memberId}::text order by ${chatMembers.memberId})`,
        })
        .from(chatChannels)
        .innerJoin(chatMembers, eq(chatMembers.channelId, chatChannels.id))
        .where(
          and(
            eq(chatChannels.organizationId, ctx.activeOrganization.id),
            eq(chatChannels.kind, "dm"),
          ),
        )
        .groupBy(chatChannels.id);
      let dmId = candidates.find(
        (row) => row.people.join(",") === everyone.join(","),
      )?.id;

      await ctx.db.transaction(async (tx) => {
        if (!dmId) {
          const [row] = await tx
            .insert(chatChannels)
            .values({
              organizationId: ctx.activeOrganization.id,
              kind: "dm",
              visibility: "private",
              createdByMemberId: access.memberId,
            })
            .returning({ id: chatChannels.id });

          dmId = row!.id;
          await tx
            .insert(chatMembers)
            .values(everyone.map((id) => ({ channelId: dmId!, memberId: id })));
        }

        const now = new Date();

        await tx.insert(chatMessages).values({
          organizationId: ctx.activeOrganization.id,
          channelId: dmId!,
          authorMemberId: access.memberId,
          body: `Could you add me to #${access.channel.name}? /chat/${access.channel.name}`,
          createdAt: now,
        });
        await tx
          .update(chatChannels)
          .set({ lastMessageAt: now })
          .where(eq(chatChannels.id, dmId!));
      });

      const profiles = await memberProfiles(ctx, [admin.memberId]);

      return {
        ok: true,
        adminName: profiles.get(admin.memberId)?.name ?? null,
      };
    }),

  /** People in the organization, to start DMs and add to channels. */
  people: chatProcedure("chat.view").query(async ({ ctx }) => {
    const memberId = await currentMemberId(ctx);
    const rows = await ctx.db
      .select({ id: members.id })
      .from(members)
      .where(eq(members.organizationId, ctx.activeOrganization.id));
    const profiles = await memberProfiles(
      ctx,
      rows.map((row) => row.id),
    );

    return [...profiles.values()]
      .map((profile) => ({ ...profile, isMe: profile.memberId === memberId }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }),

  /** Channels linked to a project or team, for their pages. */
  linkedTo: chatProcedure("chat.view")
    .input(z.object({ type: z.enum(["team", "project"]), id: uuid }))
    .query(async ({ ctx, input }) => {
      const memberId = await currentMemberId(ctx);
      const rows = await ctx.db
        .select({
          id: chatChannels.id,
          name: chatChannels.name,
          visibility: chatChannels.visibility,
          lastMessageAt: chatChannels.lastMessageAt,
          joined: sql<boolean>`${chatMembers.id} is not null`,
        })
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
            eq(chatChannels.linkType, input.type),
            eq(chatChannels.linkId, input.id),
            isNull(chatChannels.archivedAt),
          ),
        )
        .orderBy(desc(chatChannels.lastMessageAt));

      // Private channels show only to their members.
      return rows.filter((row) => row.visibility === "public" || row.joined);
    }),
};
