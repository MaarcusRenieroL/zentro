import {
  bigint,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { members, organizations } from "./auth";

/**
 * A stored file. The bytes live in the configured storage (a local folder
 * in development, an S3-compatible bucket in production) under `storageKey`.
 */
export const files = pgTable(
  "file",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    organizationId: uuid("organizationId")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    uploadedByMemberId: uuid("uploadedByMemberId").references(
      () => members.id,
      { onDelete: "set null" },
    ),

    name: text("name").notNull(),
    mimeType: text("mimeType").notNull(),
    size: bigint("size", { mode: "number" }).notNull(),
    /** Image width and height, when known, for layout before it loads. */
    width: integer("width"),
    height: integer("height"),
    storageKey: text("storageKey").notNull(),

    deletedAt: timestamp("deletedAt"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (table) => [index("file_organization_idx").on(table.organizationId)],
);

/** Files attached to a chat message, in the order they were added. */
export const chatAttachments = pgTable(
  "chatAttachment",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    messageId: uuid("messageId").notNull(),
    fileId: uuid("fileId")
      .notNull()
      .references(() => files.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
  },
  (table) => [
    index("chat_attachment_message_idx").on(table.messageId),
    index("chat_attachment_file_idx").on(table.fileId),
  ],
);

export type StoredFile = typeof files.$inferSelect;
