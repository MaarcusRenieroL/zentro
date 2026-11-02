import { TRPCError } from "@trpc/server";
import { alias, and, asc, desc, eq, notInArray } from "@zentro/db/drizzle";
import { employees, leaveRequests, members, users } from "@zentro/db/schema";
import { z } from "zod";

import { currentMemberId } from "../chat";
import { permissionProcedure, router, type OrganizationContext } from "../trpc";

const uuid = z.string().uuid();
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date.");

export const employeeStatuses = [
  "active",
  "on_leave",
  "leaving",
  "former",
] as const;
export const leaveTypes = [
  "annual",
  "sick",
  "unpaid",
  "parental",
  "other",
] as const;

const procedure = (permission: string, audit?: string[], also?: string[]) =>
  permissionProcedure(permission, undefined, { module: "hr", audit, also });

/** Weekdays from `start` to `end`, both included. */
export function countWeekdays(start: string, end: string) {
  const from = new Date(`${start}T00:00:00Z`);
  const to = new Date(`${end}T00:00:00Z`);
  let days = 0;

  for (let day = from; day <= to; day = new Date(+day + 864e5)) {
    const weekday = day.getUTCDay();

    if (weekday !== 0 && weekday !== 6) days += 1;
  }

  return days;
}

const employeeInput = z.object({
  name: z.string().trim().min(1, "Enter a name.").max(120),
  email: z
    .string()
    .trim()
    .email("That email address doesn't look right.")
    .max(200)
    .nullable()
    .default(null),
  jobTitle: z.string().trim().max(120).default(""),
  department: z.string().trim().max(80).nullable().default(null),
  location: z.string().trim().max(80).nullable().default(null),
  status: z.enum(employeeStatuses).default("active"),
  startDate: isoDate.nullable().default(null),
  endDate: isoDate.nullable().default(null),
  managerId: uuid.nullable().default(null),
  memberId: uuid.nullable().default(null),
});

async function findEmployee(ctx: OrganizationContext, id: string) {
  const [employee] = await ctx.db
    .select()
    .from(employees)
    .where(
      and(
        eq(employees.id, id),
        eq(employees.organizationId, ctx.activeOrganization.id),
      ),
    )
    .limit(1);

  if (!employee) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Person not found." });
  }

  return employee;
}

/** Rejects a manager or member link that belongs to another organization. */
async function assertLinks(
  ctx: OrganizationContext,
  input: { managerId: string | null; memberId: string | null },
  selfId?: string,
) {
  const organizationId = ctx.activeOrganization.id;

  if (input.managerId) {
    if (input.managerId === selfId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Someone can't be their own manager.",
      });
    }

    await findEmployee(ctx, input.managerId);
  }

  if (input.memberId) {
    const [member] = await ctx.db
      .select({ id: members.id })
      .from(members)
      .where(
        and(
          eq(members.id, input.memberId),
          eq(members.organizationId, organizationId),
        ),
      )
      .limit(1);

    if (!member) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "That account isn't in this organization.",
      });
    }

    const [taken] = await ctx.db
      .select({ id: employees.id })
      .from(employees)
      .where(
        and(
          eq(employees.organizationId, organizationId),
          eq(employees.memberId, input.memberId),
        ),
      )
      .limit(1);

    if (taken && taken.id !== selfId) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "That account already belongs to another person.",
      });
    }
  }
}

/** The employee record of the caller, when they have one. */
export async function currentEmployee(ctx: OrganizationContext) {
  const memberId = await currentMemberId(ctx);
  const [employee] = await ctx.db
    .select()
    .from(employees)
    .where(
      and(
        eq(employees.organizationId, ctx.activeOrganization.id),
        eq(employees.memberId, memberId),
      ),
    )
    .limit(1);

  return employee ?? null;
}

const manager = alias(employees, "manager");

export const hrRouter = router({
  directory: procedure("hr.view").query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({ employee: employees, managerName: manager.name })
      .from(employees)
      .leftJoin(manager, eq(manager.id, employees.managerId))
      .where(eq(employees.organizationId, ctx.activeOrganization.id))
      .orderBy(asc(employees.name));
    const mine = await currentEmployee(ctx);
    const canManage = await ctx.permissions.can("hr.manage");

    return {
      canManage,
      myEmployeeId: mine?.id ?? null,
      people: rows.map(({ employee, managerName }) => ({
        id: employee.id,
        name: employee.name,
        email: employee.email,
        jobTitle: employee.jobTitle,
        department: employee.department,
        location: employee.location,
        status: employee.status,
        startDate: employee.startDate,
        endDate: employee.endDate,
        managerId: employee.managerId,
        managerName: managerName ?? null,
        memberId: employee.memberId,
      })),
    };
  }),

  /** Accounts that do not have an employee record yet, for linking. */
  unlinkedMembers: procedure("hr.manage").query(async ({ ctx }) => {
    const linked = await ctx.db
      .select({ memberId: employees.memberId })
      .from(employees)
      .where(eq(employees.organizationId, ctx.activeOrganization.id));
    const taken = linked.flatMap((row) => (row.memberId ? [row.memberId] : []));

    return ctx.db
      .select({ id: members.id, name: users.name, email: users.email })
      .from(members)
      .innerJoin(users, eq(users.id, members.userId))
      .where(
        and(
          eq(members.organizationId, ctx.activeOrganization.id),
          taken.length ? notInArray(members.id, taken) : undefined,
        ),
      )
      .orderBy(asc(users.name));
  }),

  create: procedure("hr.manage", ["employee.added"])
    .input(employeeInput)
    .mutation(async ({ ctx, input }) => {
      await assertLinks(ctx, input);

      return ctx.db.transaction(async (tx) => {
        const [row] = await tx
          .insert(employees)
          .values({ ...input, organizationId: ctx.activeOrganization.id })
          .returning({ id: employees.id });

        await ctx.audit.record(tx, {
          action: "employee.added",
          target: { id: row!.id, label: input.name },
        });

        return { id: row!.id };
      });
    }),

  update: procedure("hr.manage", ["employee.updated"])
    .input(z.object({ id: uuid, data: employeeInput }))
    .mutation(async ({ ctx, input }) => {
      const employee = await findEmployee(ctx, input.id);

      await assertLinks(ctx, input.data, employee.id);

      await ctx.db.transaction(async (tx) => {
        await tx
          .update(employees)
          .set({ ...input.data, updatedAt: new Date() })
          .where(eq(employees.id, employee.id));
        await ctx.audit.record(tx, {
          action: "employee.updated",
          target: { id: employee.id, label: input.data.name },
        });
      });

      return { id: employee.id };
    }),

  remove: procedure("hr.manage", ["employee.removed"])
    .input(z.object({ id: uuid }))
    .mutation(async ({ ctx, input }) => {
      const employee = await findEmployee(ctx, input.id);

      await ctx.db.transaction(async (tx) => {
        await tx.delete(employees).where(eq(employees.id, employee.id));
        await ctx.audit.record(tx, {
          action: "employee.removed",
          target: { id: employee.id, label: employee.name },
        });
      });

      return { id: employee.id };
    }),

  /** Everyone's requests for HR managers; just the caller's for everyone else. */
  leaveList: procedure("hr.view").query(async ({ ctx }) => {
    const canManage = await ctx.permissions.can("hr.manage");
    const mine = await currentEmployee(ctx);

    if (!canManage && !mine) {
      return { canManage, canRequest: false, requests: [] };
    }

    const rows = await ctx.db
      .select({ request: leaveRequests, name: employees.name })
      .from(leaveRequests)
      .innerJoin(employees, eq(employees.id, leaveRequests.employeeId))
      .where(
        and(
          eq(leaveRequests.organizationId, ctx.activeOrganization.id),
          canManage ? undefined : eq(leaveRequests.employeeId, mine!.id),
        ),
      )
      .orderBy(desc(leaveRequests.createdAt))
      .limit(300);

    return {
      canManage,
      canRequest:
        Boolean(mine) && (await ctx.permissions.can("hr.leave.request")),
      requests: rows.map(({ request, name }) => ({
        id: request.id,
        employeeId: request.employeeId,
        employeeName: name,
        type: request.type,
        startDate: request.startDate,
        endDate: request.endDate,
        days: request.days,
        note: request.note,
        status: request.status,
        mine: request.employeeId === mine?.id,
      })),
    };
  }),

  leaveRequest: procedure("hr.view", undefined, ["hr.leave.request"])
    .input(
      z
        .object({
          type: z.enum(leaveTypes).default("annual"),
          startDate: isoDate,
          endDate: isoDate,
          note: z.string().trim().max(500).nullable().default(null),
        })
        .refine((value) => value.endDate >= value.startDate, {
          message: "The leave can't end before it starts.",
          path: ["endDate"],
        }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!(await ctx.permissions.can("hr.leave.request"))) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can't request leave.",
        });
      }

      const employee = await currentEmployee(ctx);

      if (!employee) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You don't have an employee record yet. Ask HR to add you.",
        });
      }

      const days = countWeekdays(input.startDate, input.endDate);

      if (days === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "That range only covers a weekend.",
        });
      }

      const [row] = await ctx.db
        .insert(leaveRequests)
        .values({
          ...input,
          days,
          organizationId: ctx.activeOrganization.id,
          employeeId: employee.id,
        })
        .returning({ id: leaveRequests.id });

      return { id: row!.id };
    }),

  leaveCancel: procedure("hr.view")
    .input(z.object({ id: uuid }))
    .mutation(async ({ ctx, input }) => {
      const mine = await currentEmployee(ctx);
      const result = mine
        ? await ctx.db
            .update(leaveRequests)
            .set({ status: "cancelled" })
            .where(
              and(
                eq(leaveRequests.id, input.id),
                eq(leaveRequests.employeeId, mine.id),
                eq(leaveRequests.status, "pending"),
              ),
            )
            .returning({ id: leaveRequests.id })
        : [];

      if (!result.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "There's no pending request of yours to cancel.",
        });
      }

      return { id: input.id };
    }),

  leaveDecide: procedure("hr.manage", ["leave.decided"])
    .input(z.object({ id: uuid, decision: z.enum(["approved", "rejected"]) }))
    .mutation(async ({ ctx, input }) => {
      const decider = await currentMemberId(ctx);
      const [row] = await ctx.db
        .select({ request: leaveRequests, name: employees.name })
        .from(leaveRequests)
        .innerJoin(employees, eq(employees.id, leaveRequests.employeeId))
        .where(
          and(
            eq(leaveRequests.id, input.id),
            eq(leaveRequests.organizationId, ctx.activeOrganization.id),
          ),
        )
        .limit(1);

      if (!row) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Request not found.",
        });
      }

      if (row.request.status !== "pending") {
        throw new TRPCError({
          code: "CONFLICT",
          message: "That request has already been decided.",
        });
      }

      await ctx.db.transaction(async (tx) => {
        await tx
          .update(leaveRequests)
          .set({
            status: input.decision,
            decidedByMemberId: decider,
            decidedAt: new Date(),
          })
          .where(eq(leaveRequests.id, row.request.id));
        await ctx.audit.record(tx, {
          action: "leave.decided",
          target: { id: row.request.id, label: row.name },
          metadata: { decision: input.decision, days: row.request.days },
        });
      });

      return { id: row.request.id };
    }),
});
