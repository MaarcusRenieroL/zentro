import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { organizations, users } from "./auth";

/**
 * What a person has read in their inbox. Notifications themselves are derived
 * from tasks, comments and the activity log; only the read marks are stored.
 * The key "*" means "everything up to readAt" (Mark all read).
 */
export const notificationReads = pgTable(
  "notificationRead",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    organizationId: uuid("organizationId")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    itemKey: text("itemKey").notNull(),

    readAt: timestamp("readAt").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("notification_read_unique_idx").on(
      table.organizationId,
      table.userId,
      table.itemKey,
    ),
    index("notification_read_user_idx").on(table.userId),
  ],
);

export type NotificationRead = typeof notificationReads.$inferSelect;
