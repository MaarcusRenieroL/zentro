import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { members, organizations } from "./auth";
import { projects } from "./project";

export const automations = pgTable("automation", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organizationId")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  projectId: uuid("projectId").references(() => projects.id, {
    onDelete: "cascade",
  }),
  name: text("name").notNull(),
  description: text("description"),
  enabled: boolean("enabled").notNull().default(true),
  triggerEvent: text("triggerEvent").notNull(),
  triggerConfig: jsonb("triggerConfig")
    .$type<Record<string, unknown>>()
    .default({}),
  actionType: text("actionType").notNull(),
  actionConfig: jsonb("actionConfig")
    .$type<Record<string, unknown>>()
    .default({}),
  runCount: integer("runCount").notNull().default(0),
  lastRunAt: timestamp("lastRunAt"),
  createdByMemberId: uuid("createdByMemberId").references(() => members.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Automation = typeof automations.$inferSelect;
export type NewAutomation = typeof automations.$inferInsert;
