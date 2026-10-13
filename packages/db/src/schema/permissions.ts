import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { organizations, users } from "./auth";

export type RoleScope = "organization" | "team" | "project";

export const roles = pgTable(
  "role",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    organizationId: uuid("organizationId")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    name: text("name").notNull(),
    description: text("description"),
    scope: text("scope").$type<RoleScope>().notNull(),
    kind: text("kind").$type<"system" | "custom">().notNull(),
    systemKey: text("systemKey"),
    permissions: jsonb("permissions").$type<string[]>().notNull().default([]),

    createdByUserId: uuid("createdByUserId").references(() => users.id, {
      onDelete: "set null",
    }),

    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("role_organization_scope_name_unique").on(
      table.organizationId,
      table.scope,
      table.name,
    ),
    uniqueIndex("role_organization_system_key_unique").on(
      table.organizationId,
      table.systemKey,
    ),
    index("role_organization_idx").on(table.organizationId),
  ],
);

export const roleAssignments = pgTable(
  "roleAssignment",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    organizationId: uuid("organizationId")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    roleId: uuid("roleId")
      .notNull()
      .references(() => roles.id),

    principalType: text("principalType").$type<"user" | "team">().notNull(),
    principalId: uuid("principalId").notNull(),

    scopeType: text("scopeType").$type<RoleScope>().notNull(),
    // For organization scope this is the organization id, never null.
    scopeId: uuid("scopeId").notNull(),

    createdByUserId: uuid("createdByUserId").references(() => users.id, {
      onDelete: "set null",
    }),

    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("role_assignment_unique").on(
      table.roleId,
      table.principalType,
      table.principalId,
      table.scopeType,
      table.scopeId,
    ),
    index("role_assignment_organization_principal_idx").on(
      table.organizationId,
      table.principalType,
      table.principalId,
    ),
    index("role_assignment_scope_idx").on(table.scopeType, table.scopeId),
  ],
);

export const permissionOverrides = pgTable(
  "permissionOverride",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    organizationId: uuid("organizationId")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    permission: text("permission").notNull(),
    effect: text("effect").$type<"allow" | "deny">().notNull(),

    scopeType: text("scopeType").$type<RoleScope>().notNull(),
    scopeId: uuid("scopeId").notNull(),

    reason: text("reason"),

    createdByUserId: uuid("createdByUserId").references(() => users.id, {
      onDelete: "set null",
    }),

    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("permission_override_unique").on(
      table.userId,
      table.permission,
      table.scopeType,
      table.scopeId,
    ),
    index("permission_override_organization_user_idx").on(
      table.organizationId,
      table.userId,
    ),
  ],
);

// Append-only: nothing in the application updates or deletes these rows.
export const permissionChangeLogs = pgTable(
  "permissionChangeLog",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    organizationId: uuid("organizationId")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    actorUserId: uuid("actorUserId").references(() => users.id, {
      onDelete: "set null",
    }),

    action: text("action").notNull(),
    targetType: text("targetType").notNull(),
    targetId: text("targetId").notNull(),

    before: jsonb("before").$type<unknown>(),
    after: jsonb("after").$type<unknown>(),

    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (table) => [
    index("permission_change_log_organization_created_idx").on(
      table.organizationId,
      table.createdAt,
    ),
    index("permission_change_log_actor_idx").on(table.actorUserId),
  ],
);

export type Role = typeof roles.$inferSelect;
export type RoleAssignment = typeof roleAssignments.$inferSelect;
export type PermissionOverride = typeof permissionOverrides.$inferSelect;
export type PermissionChangeLog = typeof permissionChangeLogs.$inferSelect;
