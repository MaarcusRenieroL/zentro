import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { members, organizations } from "./auth";
import { tasks } from "./task";

export const taskActivityEvents = pgTable(
  "taskActivityEvent",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    organizationId: uuid("organizationId")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    taskId: uuid("taskId")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),

    actorMemberId: uuid("actorMemberId").references(() => members.id, {
      onDelete: "set null",
    }),

    type: text("type").notNull(),
    field: text("field"),
    fromValue: text("fromValue"),
    toValue: text("toValue"),
    commentId: uuid("commentId"),

    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (table) => [
    index("task_activity_organization_task_idx").on(
      table.organizationId,
      table.taskId,
    ),
    index("task_activity_actor_idx").on(table.actorMemberId),
    index("task_activity_created_at_idx").on(table.createdAt),
  ],
);

export type TaskActivityEvent = typeof taskActivityEvents.$inferSelect;
export type NewTaskActivityEvent = typeof taskActivityEvents.$inferInsert;
