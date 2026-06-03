import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { members, organizations } from "./auth";
import { tasks } from "./task";

export const taskComments = pgTable(
  "taskComment",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    organizationId: uuid("organizationId")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    taskId: uuid("taskId")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),

    authorMemberId: uuid("authorMemberId").references(() => members.id, {
      onDelete: "set null",
    }),

    body: text("body").notNull(),

    deletedAt: timestamp("deletedAt"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => [
    index("task_comment_organization_task_idx").on(
      table.organizationId,
      table.taskId,
    ),
    index("task_comment_author_idx").on(table.authorMemberId),
  ],
);

export type TaskComment = typeof taskComments.$inferSelect;
export type NewTaskComment = typeof taskComments.$inferInsert;
