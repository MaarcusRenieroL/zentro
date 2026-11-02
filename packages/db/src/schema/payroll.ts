import {
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { members, organizations } from "./auth";
import { employees } from "./hr";

/** What an employee is paid. Amounts are whole minor units (cents). */
export const compensations = pgTable(
  "compensation",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    organizationId: uuid("organizationId")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    employeeId: uuid("employeeId")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),

    annualSalary: integer("annualSalary").notNull(),
    currency: text("currency").notNull().default("USD"),

    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => [uniqueIndex("compensation_employee_unique").on(table.employeeId)],
);

/** One pay period. Moves draft → approved → paid and is then frozen. */
export const payRuns = pgTable(
  "payRun",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    organizationId: uuid("organizationId")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    createdByMemberId: uuid("createdByMemberId").references(() => members.id, {
      onDelete: "set null",
    }),

    label: text("label").notNull(),
    periodStart: date("periodStart", { mode: "string" }).notNull(),
    periodEnd: date("periodEnd", { mode: "string" }).notNull(),
    /** Share of gross held back as tax and contributions, in basis points. */
    deductionRateBps: integer("deductionRateBps").notNull().default(2000),

    status: text("status").notNull().default("draft"),
    approvedAt: timestamp("approvedAt"),
    paidAt: timestamp("paidAt"),

    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (table) => [index("pay_run_organization_idx").on(table.organizationId)],
);

/** One employee's line in a pay run, with the figures frozen at creation. */
export const payslips = pgTable(
  "payslip",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    payRunId: uuid("payRunId")
      .notNull()
      .references(() => payRuns.id, { onDelete: "cascade" }),
    organizationId: uuid("organizationId")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    employeeId: uuid("employeeId").references(() => employees.id, {
      onDelete: "set null",
    }),

    employeeName: text("employeeName").notNull(),
    currency: text("currency").notNull().default("USD"),
    base: integer("base").notNull(),
    bonus: integer("bonus").notNull().default(0),
    deductions: integer("deductions").notNull(),
    net: integer("net").notNull(),
  },
  (table) => [
    index("payslip_run_idx").on(table.payRunId),
    index("payslip_employee_idx").on(table.employeeId),
  ],
);

export type PayRun = typeof payRuns.$inferSelect;
export type Payslip = typeof payslips.$inferSelect;
