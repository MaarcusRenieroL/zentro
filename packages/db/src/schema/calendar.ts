import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { members, organizations } from "./auth";

/** A shared calendar event, visible to everyone who can open Calendar. */
export const calendarEvents = pgTable(
  "calendarEvent",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    organizationId: uuid("organizationId")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    createdByMemberId: uuid("createdByMemberId").references(() => members.id, {
      onDelete: "set null",
    }),

    title: text("title").notNull(),
    description: text("description"),
    location: text("location"),
    color: text("color").notNull().default("blue"),
    allDay: boolean("allDay").notNull().default(false),
    startsAt: timestamp("startsAt").notNull(),
    endsAt: timestamp("endsAt").notNull(),

    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => [
    index("calendar_event_range_idx").on(table.organizationId, table.startsAt),
  ],
);

export type CalendarEvent = typeof calendarEvents.$inferSelect;
