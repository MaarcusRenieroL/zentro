import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { members, organizations } from "./auth";

export const teams = pgTable(
  "team",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    organizationId: uuid("organizationId")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    name: text("name").notNull(),
    description: text("description"),
    color: text("color").notNull().default("slate"),

    createdByMemberId: uuid("createdByMemberId").references(() => members.id, {
      onDelete: "set null",
    }),

    archivedAt: timestamp("archivedAt"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("team_organization_name_unique").on(
      table.organizationId,
      table.name,
    ),
    index("team_organization_idx").on(table.organizationId),
    index("team_created_by_member_idx").on(table.createdByMemberId),
    index("team_archived_at_idx").on(table.archivedAt),
  ],
);

export const teamMembers = pgTable(
  "teamMember",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    organizationId: uuid("organizationId")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    teamId: uuid("teamId")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),

    memberId: uuid("memberId")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),

    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("team_member_team_member_unique").on(
      table.teamId,
      table.memberId,
    ),
    index("team_member_organization_team_idx").on(
      table.organizationId,
      table.teamId,
    ),
    index("team_member_member_idx").on(table.memberId),
  ],
);

export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
