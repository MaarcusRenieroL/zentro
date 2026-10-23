import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { members, organizations } from "./auth";

/**
 * A message between people in an organization. A row with no `sentAt` is the
 * sender's draft and is invisible to its recipients.
 */
export const mailMessages = pgTable(
  "mailMessage",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    organizationId: uuid("organizationId")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    senderMemberId: uuid("senderMemberId").references(() => members.id, {
      onDelete: "set null",
    }),
    /** The first message of the conversation (itself for a new one). */
    threadId: uuid("threadId").notNull(),

    subject: text("subject").notNull().default(""),
    body: text("body").notNull().default(""),

    senderStarred: boolean("senderStarred").notNull().default(false),
    senderTrashedAt: timestamp("senderTrashedAt"),
    senderPurgedAt: timestamp("senderPurgedAt"),

    sentAt: timestamp("sentAt"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => [
    index("mail_message_thread_idx").on(table.threadId),
    index("mail_message_sender_idx").on(table.senderMemberId),
    index("mail_message_org_idx").on(table.organizationId),
  ],
);

/** One recipient of a message, with their own read, star and trash state. */
export const mailRecipients = pgTable(
  "mailRecipient",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    messageId: uuid("messageId")
      .notNull()
      .references(() => mailMessages.id, { onDelete: "cascade" }),
    memberId: uuid("memberId")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),

    kind: text("kind").notNull().default("to"),
    readAt: timestamp("readAt"),
    starred: boolean("starred").notNull().default(false),
    trashedAt: timestamp("trashedAt"),
    purgedAt: timestamp("purgedAt"),
  },
  (table) => [
    index("mail_recipient_member_idx").on(table.memberId),
    index("mail_recipient_message_idx").on(table.messageId),
  ],
);

export type MailMessage = typeof mailMessages.$inferSelect;
