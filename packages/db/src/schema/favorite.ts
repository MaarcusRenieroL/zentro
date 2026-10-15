import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { organizations, users } from "./auth";

/** What a person starred: a project, doc or task. Personal, never shared. */
export const favorites = pgTable(
  "favorite",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    organizationId: uuid("organizationId")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    targetType: text("targetType").notNull(),
    targetId: uuid("targetId").notNull(),

    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("favorite_unique_idx").on(
      table.organizationId,
      table.userId,
      table.targetType,
      table.targetId,
    ),
    index("favorite_user_idx").on(table.userId),
  ],
);

export type Favorite = typeof favorites.$inferSelect;
