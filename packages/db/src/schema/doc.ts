import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { members, organizations } from "./auth";
import { projects } from "./project";

export const docs = pgTable(
  "doc",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    organizationId: uuid("organizationId")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    projectId: uuid("projectId").references(() => projects.id, {
      onDelete: "set null",
    }),

    title: text("title").notNull().default("Untitled"),
    content: text("content").notNull().default(""),

    slug: text("slug").notNull(),

    createdByMemberId: uuid("createdByMemberId").references(() => members.id, {
      onDelete: "set null",
    }),

    archivedAt: timestamp("archivedAt"),
    deletedAt: timestamp("deletedAt"),

    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => [
    index("doc_organization_deleted_at_idx").on(
      table.organizationId,
      table.deletedAt,
    ),
    index("doc_organization_project_idx").on(
      table.organizationId,
      table.projectId,
    ),
    index("doc_created_by_member_idx").on(table.createdByMemberId),
    index("doc_updated_at_idx").on(table.updatedAt),
    uniqueIndex("doc_organization_slug_unique").on(
      table.organizationId,
      table.slug,
    ),
  ],
);

export type Doc = typeof docs.$inferSelect;
export type NewDoc = typeof docs.$inferInsert;
