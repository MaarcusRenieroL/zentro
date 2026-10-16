import {
  type AnyPgColumn,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { members, organizations } from "./auth";
import { projects } from "./project";
import { teams } from "./team";

export const tasks = pgTable(
  "task",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    organizationId: uuid("organizationId")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    projectId: uuid("projectId")
      .notNull()
      .references(() => projects.id, {
        onDelete: "cascade",
      }),

    parentTaskId: uuid("parentTaskId").references((): AnyPgColumn => tasks.id, {
      onDelete: "cascade",
    }),

    teamId: uuid("teamId").references(() => teams.id, {
      onDelete: "set null",
    }),

    key: text("key").notNull(),
    taskNumber: integer("taskNumber").notNull(),

    name: text("name").notNull(),
    description: text("description"),

    status: text("status").notNull().default("todo"),
    priority: text("priority").notNull().default("medium"),

    createdByMemberId: uuid("createdByMemberId").references(() => members.id, {
      onDelete: "set null",
    }),

    assignedToMemberId: uuid("assignedToMemberId").references(
      () => members.id,
      {
        onDelete: "set null",
      },
    ),

    dueAt: timestamp("dueAt"),
    completedAt: timestamp("completedAt"),
    archivedAt: timestamp("archivedAt"),
    deletedAt: timestamp("deletedAt"),

    estimatePoints: integer("estimatePoints"),
    timeSpentMinutes: integer("timeSpentMinutes").default(0).notNull(),

    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("task_organization_key_unique").on(
      table.organizationId,
      table.key,
    ),
    uniqueIndex("task_project_number_unique").on(
      table.projectId,
      table.taskNumber,
    ),
    index("task_organization_status_idx").on(
      table.organizationId,
      table.status,
    ),
    index("task_project_status_idx").on(table.projectId, table.status),
    index("task_team_status_idx").on(table.teamId, table.status),
    index("task_assigned_to_member_idx").on(table.assignedToMemberId),
    index("task_due_at_idx").on(table.dueAt),
    index("task_parent_task_idx").on(table.parentTaskId),
  ],
);

export const taskTimeLogs = pgTable(
  "taskTimeLog",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organizationId")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    taskId: uuid("taskId")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    memberId: uuid("memberId").references(() => members.id, {
      onDelete: "set null",
    }),
    durationMinutes: integer("durationMinutes").notNull(),
    note: text("note"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (table) => [
    index("task_time_log_org_idx").on(table.organizationId),
    index("task_time_log_task_idx").on(table.taskId),
    index("task_time_log_member_idx").on(table.memberId),
  ],
);

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type TaskTimeLog = typeof taskTimeLogs.$inferSelect;
export type NewTaskTimeLog = typeof taskTimeLogs.$inferInsert;
