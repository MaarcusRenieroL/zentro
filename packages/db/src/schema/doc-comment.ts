import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { members, organizations } from "./auth";
import { docs } from "./doc";

export const docComments = pgTable(
  "docComment",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    organizationId: uuid("organizationId")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    docId: uuid("docId")
      .notNull()
      .references(() => docs.id, { onDelete: "cascade" }),

    authorMemberId: uuid("authorMemberId").references(() => members.id, {
      onDelete: "set null",
    }),

    body: text("body").notNull(),

    resolvedAt: timestamp("resolvedAt"),
    deletedAt: timestamp("deletedAt"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => [
    index("doc_comment_organization_doc_idx").on(
      table.organizationId,
      table.docId,
    ),
    index("doc_comment_author_idx").on(table.authorMemberId),
    index("doc_comment_resolved_idx").on(table.resolvedAt),
  ],
);

export type DocComment = typeof docComments.$inferSelect;
export type NewDocComment = typeof docComments.$inferInsert;
