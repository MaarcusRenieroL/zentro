import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { members, organizations } from "./auth";

/** A shared whiteboard. `elements` is the drawing, stored as one JSON list. */
export const whiteboards = pgTable(
  "whiteboard",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    organizationId: uuid("organizationId")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    createdByMemberId: uuid("createdByMemberId").references(() => members.id, {
      onDelete: "set null",
    }),

    title: text("title").notNull(),
    elements: jsonb("elements").notNull().default([]),

    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => [
    index("whiteboard_org_idx").on(table.organizationId, table.updatedAt),
  ],
);

export type Whiteboard = typeof whiteboards.$inferSelect;
