import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { members, organizations } from "./auth";
import { tasks } from "./task";

/** A support request, numbered per organization (SUP-1, SUP-2, …). */
export const tickets = pgTable(
  "ticket",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    organizationId: uuid("organizationId")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    number: integer("number").notNull(),

    subject: text("subject").notNull(),
    description: text("description").notNull().default(""),
    requesterName: text("requesterName").notNull(),
    requesterEmail: text("requesterEmail"),

    status: text("status").notNull().default("open"),
    priority: text("priority").notNull().default("normal"),
    category: text("category"),

    assigneeMemberId: uuid("assigneeMemberId").references(() => members.id, {
      onDelete: "set null",
    }),
    createdByMemberId: uuid("createdByMemberId").references(() => members.id, {
      onDelete: "set null",
    }),
    linkedTaskId: uuid("linkedTaskId").references(() => tasks.id, {
      onDelete: "set null",
    }),

    resolvedAt: timestamp("resolvedAt"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("ticket_organization_number_unique").on(
      table.organizationId,
      table.number,
    ),
    index("ticket_queue_idx").on(table.organizationId, table.status),
    index("ticket_assignee_idx").on(table.assigneeMemberId),
  ],
);

/** One entry in a ticket's thread: a reply to the requester or an internal note. */
export const ticketMessages = pgTable(
  "ticketMessage",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    ticketId: uuid("ticketId")
      .notNull()
      .references(() => tickets.id, { onDelete: "cascade" }),
    organizationId: uuid("organizationId")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    authorMemberId: uuid("authorMemberId").references(() => members.id, {
      onDelete: "set null",
    }),

    /** `reply` goes to the requester, `note` stays inside the team. */
    kind: text("kind").notNull().default("reply"),
    body: text("body").notNull(),

    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (table) => [index("ticket_message_ticket_idx").on(table.ticketId)],
);

export type Ticket = typeof tickets.$inferSelect;
export type TicketMessage = typeof ticketMessages.$inferSelect;
