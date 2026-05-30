import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { organizations, users } from "./auth";

export const projects = pgTable(
  "project",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    organizationId: uuid("organizationId")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),

    status: text("status").notNull().default("active"),

    createdById: uuid("createdById").references(() => users.id, {
      onDelete: "set null",
    }),

    archivedAt: timestamp("archivedAt"),
    deletedAt: timestamp("deletedAt"),

    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("project_organization_slug_unique").on(
      table.organizationId,
      table.slug,
    ),
    index("project_organization_status_idx").on(
      table.organizationId,
      table.status,
    ),
  ],
);

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
