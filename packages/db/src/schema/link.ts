import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { members, organizations } from "./auth";

/**
 * A connection between two pieces of work in different places: a task that
 * blocks another, a doc that specs a task, a doc that mentions a task key.
 *
 * - `kind` is "blocks" (source blocks target), "relates" (either way) or
 *   "mentions" (the source's text names the target task).
 * - `via` says where an automatic mention came from ("content",
 *   "description", "comment"); manual links leave it empty.
 *
 * Ids are plain columns so a link can point at any module; deleting a task
 * or doc removes its links in the same transaction.
 */
export const workLinks = pgTable(
  "workLink",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    organizationId: uuid("organizationId")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    sourceType: text("sourceType").notNull(),
    sourceId: uuid("sourceId").notNull(),
    targetType: text("targetType").notNull(),
    targetId: uuid("targetId").notNull(),

    kind: text("kind").notNull(),
    via: text("via"),

    createdByMemberId: uuid("createdByMemberId").references(() => members.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("work_link_unique_idx").on(
      table.organizationId,
      table.sourceType,
      table.sourceId,
      table.targetType,
      table.targetId,
      table.kind,
    ),
    index("work_link_source_idx").on(table.sourceType, table.sourceId),
    index("work_link_target_idx").on(table.targetType, table.targetId),
  ],
);

export type WorkLink = typeof workLinks.$inferSelect;
export type NewWorkLink = typeof workLinks.$inferInsert;
