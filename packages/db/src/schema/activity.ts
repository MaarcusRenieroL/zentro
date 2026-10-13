import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { organizations, users } from "./auth";

/** One entry of `metadata.changes`. */
export type ActivityChange = {
  field: string;
  from: string | null;
  to: string | null;
};

export type ActivityMetadata = {
  changes?: ActivityChange[];
  [key: string]: unknown;
};

// Append-only: nothing in the application updates or deletes these rows. The
// only removal is the cascade when an organization is deleted. Events carry a
// snapshot of the target's name so history survives renames and deletes, and
// `projectId` / `teamId` are plain columns (no foreign keys) so an event keeps
// its place after the project or team is gone.
export const activityEvents = pgTable(
  "activityEvent",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    organizationId: uuid("organizationId")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    // Null means the system acted.
    actorUserId: uuid("actorUserId").references(() => users.id, {
      onDelete: "set null",
    }),

    action: text("action").notNull(),
    targetType: text("targetType").notNull(),
    targetId: text("targetId").notNull(),
    targetLabel: text("targetLabel"),

    projectId: uuid("projectId"),
    teamId: uuid("teamId"),

    // Events that must not show up in resource activity feeds.
    auditOnly: boolean("auditOnly").notNull().default(false),

    metadata: jsonb("metadata").$type<ActivityMetadata>().notNull().default({}),

    ip: text("ip"),
    userAgent: text("userAgent"),
    requestId: text("requestId"),

    // Millisecond precision, so a JavaScript date round-trips exactly and
    // (createdAt, id) cursors are stable.
    createdAt: timestamp("createdAt", { precision: 3 }).notNull().defaultNow(),
  },
  (table) => [
    index("activity_event_organization_created_idx").on(
      table.organizationId,
      table.createdAt.desc(),
      table.id.desc(),
    ),
    index("activity_event_target_idx").on(
      table.organizationId,
      table.targetType,
      table.targetId,
      table.createdAt.desc(),
    ),
    index("activity_event_actor_idx").on(
      table.organizationId,
      table.actorUserId,
      table.createdAt.desc(),
    ),
    index("activity_event_project_idx").on(
      table.organizationId,
      table.projectId,
      table.createdAt.desc(),
    ),
    index("activity_event_action_idx").on(
      table.organizationId,
      table.action,
      table.createdAt.desc(),
    ),
  ],
);

export type ActivityEvent = typeof activityEvents.$inferSelect;
export type NewActivityEvent = typeof activityEvents.$inferInsert;
