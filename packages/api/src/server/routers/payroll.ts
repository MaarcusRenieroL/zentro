import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, inArray, sql } from "@zentro/db/drizzle";
import { compensations, employees, payRuns, payslips } from "@zentro/db/schema";
import { z } from "zod";

import { currentMemberId } from "../chat";
import { permissionProcedure, router, type OrganizationContext } from "../trpc";
import { currentEmployee } from "./hr";

const uuid = z.string().uuid();
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date.");
/** Whole minor units (cents), kept within a Postgres integer. */
const money = z.number().int().min(0).max(2_000_000_000);

const procedure = (permission: string, audit?: string[], also?: string[]) =>
  permissionProcedure(permission, undefined, {
    module: "payroll",
    audit,
    also,
  });

/** Deductions and net pay for one line, in minor units. */
export function computePay(
  base: number,
  bonus: number,
  deductionRateBps: number,
) {
  const gross = base + bonus;
  const deductions = Math.round((gross * deductionRateBps) / 10_000);

  return { deductions, net: gross - deductions };
}

async function findRun(ctx: OrganizationContext, id: string) {
  const [run] = await ctx.db
    .select()
    .from(payRuns)
    .where(
      and(
        eq(payRuns.id, id),
        eq(payRuns.organizationId, ctx.activeOrganization.id),
      ),
    )
    .limit(1);

  if (!run) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Pay run not found." });
  }

  return run;
}

function assertStatus(run: { status: string }, expected: string, verb: string) {
  if (run.status !== expected) {
    throw new TRPCError({
      code: "CONFLICT",
      message: `Only a ${expected} pay run can be ${verb}.`,
    });
  }
}

export const payrollRouter = router({
  /** Every pay run with its headcount and totals. */
  runs: procedure("payroll.view").query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({
        run: payRuns,
        people: sql<number>`count(${payslips.id})::int`,
        net: sql<number>`coalesce(sum(${payslips.net}), 0)::bigint`.mapWith(
          Number,
        ),
      })
      .from(payRuns)
      .leftJoin(payslips, eq(payslips.payRunId, payRuns.id))
      .where(eq(payRuns.organizationId, ctx.activeOrganization.id))
      .groupBy(payRuns.id)
      .orderBy(desc(payRuns.periodEnd), desc(payRuns.createdAt));

    return {
      canManage: await ctx.permissions.can("payroll.manage"),
      runs: rows.map(({ run, people, net }) => ({
        id: run.id,
        label: run.label,
        periodStart: run.periodStart,
        periodEnd: run.periodEnd,
        status: run.status,
        people,
        net,
      })),
    };
  }),

  run: procedure("payroll.view")
    .input(z.object({ id: uuid }))
    .query(async ({ ctx, input }) => {
      const run = await findRun(ctx, input.id);
      const lines = await ctx.db
        .select()
        .from(payslips)
        .where(eq(payslips.payRunId, run.id))
        .orderBy(asc(payslips.employeeName));

      return {
        id: run.id,
        label: run.label,
        periodStart: run.periodStart,
        periodEnd: run.periodEnd,
        deductionRateBps: run.deductionRateBps,
        status: run.status,
        approvedAt: run.approvedAt?.toISOString() ?? null,
        paidAt: run.paidAt?.toISOString() ?? null,
        canManage: await ctx.permissions.can("payroll.manage"),
        canApprove: await ctx.permissions.can("payroll.approve"),
        lines: lines.map((line) => ({
          id: line.id,
          employeeName: line.employeeName,
          currency: line.currency,
          base: line.base,
          bonus: line.bonus,
          deductions: line.deductions,
          net: line.net,
        })),
      };
    }),

  /** The caller's own payslips, once their run is approved. */
  mine: procedure("payroll.payslips.view").query(async ({ ctx }) => {
    const employee = await currentEmployee(ctx);

    if (!employee) return [];

    const rows = await ctx.db
      .select({ line: payslips, run: payRuns })
      .from(payslips)
      .innerJoin(payRuns, eq(payRuns.id, payslips.payRunId))
      .where(
        and(
          eq(payslips.employeeId, employee.id),
          inArray(payRuns.status, ["approved", "paid"]),
        ),
      )
      .orderBy(desc(payRuns.periodEnd));

    return rows.map(({ line, run }) => ({
      id: line.id,
      label: run.label,
      periodStart: run.periodStart,
      periodEnd: run.periodEnd,
      status: run.status,
      currency: line.currency,
      base: line.base,
      bonus: line.bonus,
      deductions: line.deductions,
      net: line.net,
    }));
  }),

  /** Everyone on the payroll with their salary, if set. */
  salaries: procedure("payroll.view").query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({
        id: employees.id,
        name: employees.name,
        jobTitle: employees.jobTitle,
        status: employees.status,
        annualSalary: compensations.annualSalary,
        currency: compensations.currency,
      })
      .from(employees)
      .leftJoin(compensations, eq(compensations.employeeId, employees.id))
      .where(eq(employees.organizationId, ctx.activeOrganization.id))
      .orderBy(asc(employees.name));

    return {
      canManage: await ctx.permissions.can("payroll.manage"),
      people: rows,
    };
  }),

  setSalary: procedure("payroll.manage", ["payroll.salary_set"])
    .input(
      z.object({
        employeeId: uuid,
        annualSalary: money,
        currency: z
          .string()
          .trim()
          .toUpperCase()
          .regex(/^[A-Z]{3}$/, "Use a 3-letter currency code.")
          .default("USD"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [employee] = await ctx.db
        .select({ id: employees.id, name: employees.name })
        .from(employees)
        .where(
          and(
            eq(employees.id, input.employeeId),
            eq(employees.organizationId, ctx.activeOrganization.id),
          ),
        )
        .limit(1);

      if (!employee) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Person not found.",
        });
      }

      await ctx.db.transaction(async (tx) => {
        await tx
          .insert(compensations)
          .values({
            organizationId: ctx.activeOrganization.id,
            employeeId: employee.id,
            annualSalary: input.annualSalary,
            currency: input.currency,
          })
          .onConflictDoUpdate({
            target: compensations.employeeId,
            set: {
              annualSalary: input.annualSalary,
              currency: input.currency,
              updatedAt: new Date(),
            },
          });
        // The amount is deliberately left out of the audit log.
        await ctx.audit.record(tx, {
          action: "payroll.salary_set",
          target: { id: employee.id, label: employee.name },
        });
      });

      return { id: employee.id };
    }),

  /** A draft run with one line per paid employee, a twelfth of salary each. */
  createRun: procedure("payroll.manage", ["payroll.run_created"])
    .input(
      z
        .object({
          label: z.string().trim().min(1, "Name the pay run.").max(80),
          periodStart: isoDate,
          periodEnd: isoDate,
          deductionRateBps: z.number().int().min(0).max(10_000).default(2000),
        })
        .refine((value) => value.periodEnd >= value.periodStart, {
          message: "The period can't end before it starts.",
          path: ["periodEnd"],
        }),
    )
    .mutation(async ({ ctx, input }) => {
      const memberId = await currentMemberId(ctx);
      const paid = await ctx.db
        .select({
          employeeId: employees.id,
          name: employees.name,
          annualSalary: compensations.annualSalary,
          currency: compensations.currency,
        })
        .from(employees)
        .innerJoin(compensations, eq(compensations.employeeId, employees.id))
        .where(
          and(
            eq(employees.organizationId, ctx.activeOrganization.id),
            inArray(employees.status, ["active", "on_leave", "leaving"]),
          ),
        );

      if (!paid.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Set a salary for at least one active employee first.",
        });
      }

      return ctx.db.transaction(async (tx) => {
        const [run] = await tx
          .insert(payRuns)
          .values({
            ...input,
            organizationId: ctx.activeOrganization.id,
            createdByMemberId: memberId,
          })
          .returning({ id: payRuns.id });

        await tx.insert(payslips).values(
          paid.map((person) => {
            const base = Math.round(person.annualSalary / 12);

            return {
              payRunId: run!.id,
              organizationId: ctx.activeOrganization.id,
              employeeId: person.employeeId,
              employeeName: person.name,
              currency: person.currency,
              base,
              bonus: 0,
              ...computePay(base, 0, input.deductionRateBps),
            };
          }),
        );
        await ctx.audit.record(tx, {
          action: "payroll.run_created",
          target: { id: run!.id, label: input.label },
        });

        return { id: run!.id };
      });
    }),

  setBonus: procedure("payroll.manage", ["payroll.bonus_set"])
    .input(z.object({ payslipId: uuid, bonus: money }))
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .select({ line: payslips, run: payRuns })
        .from(payslips)
        .innerJoin(payRuns, eq(payRuns.id, payslips.payRunId))
        .where(
          and(
            eq(payslips.id, input.payslipId),
            eq(payslips.organizationId, ctx.activeOrganization.id),
          ),
        )
        .limit(1);

      if (!row) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Payslip not found.",
        });
      }

      assertStatus(row.run, "draft", "edited");

      await ctx.db.transaction(async (tx) => {
        await tx
          .update(payslips)
          .set({
            bonus: input.bonus,
            ...computePay(row.line.base, input.bonus, row.run.deductionRateBps),
          })
          .where(eq(payslips.id, row.line.id));
        await ctx.audit.record(tx, {
          action: "payroll.bonus_set",
          target: { id: row.run.id, label: row.run.label },
        });
      });

      return { id: row.line.id };
    }),

  approveRun: procedure("payroll.approve", ["payroll.run_approved"])
    .input(z.object({ id: uuid }))
    .mutation(async ({ ctx, input }) => {
      const run = await findRun(ctx, input.id);

      assertStatus(run, "draft", "approved");

      await ctx.db.transaction(async (tx) => {
        await tx
          .update(payRuns)
          .set({ status: "approved", approvedAt: new Date() })
          .where(eq(payRuns.id, run.id));
        await ctx.audit.record(tx, {
          action: "payroll.run_approved",
          target: { id: run.id, label: run.label },
        });
      });

      return { id: run.id };
    }),

  markPaid: procedure("payroll.approve", ["payroll.run_paid"])
    .input(z.object({ id: uuid }))
    .mutation(async ({ ctx, input }) => {
      const run = await findRun(ctx, input.id);

      assertStatus(run, "approved", "marked as paid");

      await ctx.db.transaction(async (tx) => {
        await tx
          .update(payRuns)
          .set({ status: "paid", paidAt: new Date() })
          .where(eq(payRuns.id, run.id));
        await ctx.audit.record(tx, {
          action: "payroll.run_paid",
          target: { id: run.id, label: run.label },
        });
      });

      return { id: run.id };
    }),

  deleteRun: procedure("payroll.manage", ["payroll.run_deleted"])
    .input(z.object({ id: uuid }))
    .mutation(async ({ ctx, input }) => {
      const run = await findRun(ctx, input.id);

      assertStatus(run, "draft", "deleted");

      await ctx.db.transaction(async (tx) => {
        await tx.delete(payRuns).where(eq(payRuns.id, run.id));
        await ctx.audit.record(tx, {
          action: "payroll.run_deleted",
          target: { id: run.id, label: run.label },
        });
      });

      return { id: run.id };
    }),
});
