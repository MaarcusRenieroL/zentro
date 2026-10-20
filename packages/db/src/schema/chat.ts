import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { members, organizations } from "./auth";

/**
 * A conversation: a named channel, or a direct message between two or more
 * people (`kind = "dm"`, no name). A channel can be linked to a team or a
 * project; a project channel turns that project's task keys into links.
 */
export const chatChannels = pgTable(
  "chatChannel",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    organizationId: uuid("organizationId")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    kind: text("kind").notNull().default("channel"),
    /** Lowercase, numbers and dashes; unique per organization. Null for DMs. */
    name: text("name"),
    topic: text("topic"),
    description: text("description"),
    /** "public": anyone in the organization can find and join it. */
    visibility: text("visibility").notNull().default("public"),
    /** "team" or "project", with the id in `linkId`. */
    linkType: text("linkType"),
    linkId: uuid("linkId"),

    createdByMemberId: uuid("createdByMemberId").references(() => members.id, {
      onDelete: "set null",
    }),
    archivedAt: timestamp("archivedAt"),
    lastMessageAt: timestamp("lastMessageAt"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("chat_channel_name_idx").on(table.organizationId, table.name),
    index("chat_channel_org_kind_idx").on(table.organizationId, table.kind),
    index("chat_channel_link_idx").on(table.linkType, table.linkId),
  ],
);

/** Who is in a conversation, their role there and what they've read. */
export const chatMembers = pgTable(
  "chatMember",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    channelId: uuid("channelId")
      .notNull()
      .references(() => chatChannels.id, { onDelete: "cascade" }),
    memberId: uuid("memberId")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),

    /** "admin" runs the channel; "member" takes part. */
    role: text("role").notNull().default("member"),
    /** "all", "mentions" or "mute". */
    notify: text("notify").notNull().default("all"),
    notifyReplies: boolean("notifyReplies").notNull().default(true),
    mutedUntil: timestamp("mutedUntil"),
    /** Kept at the top of the person's list. */
    pinned: boolean("pinned").notNull().default(false),
    lastReadAt: timestamp("lastReadAt").notNull().defaultNow(),

    joinedAt: timestamp("joinedAt").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("chat_member_unique_idx").on(table.channelId, table.memberId),
    index("chat_member_member_idx").on(table.memberId),
  ],
);

/**
 * One message. Replies point at the first message of their thread with
 * `parentId`. `clientId` lets a message queued offline be sent twice without
 * showing up twice.
 */
export const chatMessages = pgTable(
  "chatMessage",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    organizationId: uuid("organizationId")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    channelId: uuid("channelId")
      .notNull()
      .references(() => chatChannels.id, { onDelete: "cascade" }),
    authorMemberId: uuid("authorMemberId").references(() => members.id, {
      onDelete: "set null",
    }),
    parentId: uuid("parentId"),
    clientId: text("clientId"),

    body: text("body").notNull(),

    pinnedAt: timestamp("pinnedAt"),
    pinnedByMemberId: uuid("pinnedByMemberId").references(() => members.id, {
      onDelete: "set null",
    }),
    editedAt: timestamp("editedAt"),
    deletedAt: timestamp("deletedAt"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (table) => [
    index("chat_message_channel_created_idx").on(
      table.channelId,
      table.createdAt,
    ),
    index("chat_message_parent_idx").on(table.parentId),
    uniqueIndex("chat_message_client_idx").on(
      table.authorMemberId,
      table.clientId,
    ),
  ],
);

export const chatReactions = pgTable(
  "chatReaction",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    messageId: uuid("messageId")
      .notNull()
      .references(() => chatMessages.id, { onDelete: "cascade" }),
    memberId: uuid("memberId")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    emoji: text("emoji").notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("chat_reaction_unique_idx").on(
      table.messageId,
      table.memberId,
      table.emoji,
    ),
  ],
);

export type ChatChannel = typeof chatChannels.$inferSelect;
export type ChatMember = typeof chatMembers.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
