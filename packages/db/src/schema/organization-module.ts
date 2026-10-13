import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { organizations, users } from "./auth";

// A missing row means "use the module manifest's defaultEnabled".
export const organizationModules = pgTable(
  "organizationModule",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    organizationId: uuid("organizationId")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    moduleId: text("moduleId").notNull(),
    enabled: boolean("enabled").notNull(),
    config: jsonb("config")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),

    updatedByUserId: uuid("updatedByUserId").references(() => users.id, {
      onDelete: "set null",
    }),

    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("organization_module_organization_module_unique").on(
      table.organizationId,
      table.moduleId,
    ),
    index("organization_module_updated_by_user_idx").on(table.updatedByUserId),
  ],
);
