import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { countWeekdays } from "../src/server/routers/hr";
import { computePay } from "../src/server/routers/payroll";
import { World } from "./helpers";

const world = new World();

afterAll(() => world.cleanup());

async function setup(name: string) {
  const org = await world.org(name);
  const { user: owner } = await world.userIn(org, "owner", `${name} owner`);
  const { user: member, member: memberRow } = await world.userIn(
    org,
    "member",
    `${name} member`,
  );

  return {
    org,
    asOwner: await world.caller(owner, org),
    asMember: await world.caller(member, org),
    memberId: memberRow.id,
  };
}

const person = (memberId: string | null, name = "Pat Member") => ({
  name,
  email: null,
  jobTitle: "Engineer",
  department: null,
  location: null,
  status: "active" as const,
  startDate: null,
  endDate: null,
  managerId: null,
  memberId,
});

describe("pure helpers", () => {
  it("counts weekdays and skips weekends", () => {
    // Mon 2 Nov – Sun 8 Nov 2026
    expect(countWeekdays("2026-11-02", "2026-11-08")).toBe(5);
    expect(countWeekdays("2026-11-07", "2026-11-08")).toBe(0);
    expect(countWeekdays("2026-11-02", "2026-11-02")).toBe(1);
  });

  it("computes deductions and net in minor units", () => {
    expect(computePay(500_000, 100_000, 2000)).toEqual({
      deductions: 120_000,
      net: 480_000,
    });
    expect(computePay(333_333, 0, 2000).net).toBe(266_666);
  });
});

describe("tickets", () => {
  let ctx: Awaited<ReturnType<typeof setup>>;
  let other: Awaited<ReturnType<typeof setup>>;

  beforeAll(async () => {
    ctx = await setup("Tickets A");
    other = await setup("Tickets B");
  });

  it("numbers tickets per organization", async () => {
    const first = await ctx.asMember.tickets.create({
      subject: "Card declined",
      requesterName: "Acme",
    });
    const second = await ctx.asMember.tickets.create({
      subject: "Invoice copy",
      requesterName: "Acme",
    });
    const elsewhere = await other.asMember.tickets.create({
      subject: "Hello",
      requesterName: "Zed",
    });

    expect(first.ref).toBe("SUP-1");
    expect(second.ref).toBe("SUP-2");
    expect(elsewhere.ref).toBe("SUP-1");
  });

  it("parks a ticket as pending after a reply, and notes do not", async () => {
    const { id } = await ctx.asMember.tickets.create({
      subject: "Reply flow",
      requesterName: "Acme",
    });

    await ctx.asMember.tickets.reply({ id, kind: "note", body: "internal" });
    expect((await ctx.asMember.tickets.get({ id })).status).toBe("open");

    await ctx.asMember.tickets.reply({ id, kind: "reply", body: "On it" });

    const ticket = await ctx.asMember.tickets.get({ id });

    expect(ticket.status).toBe("pending");
    expect(ticket.messages.map((message) => message.kind)).toEqual([
      "note",
      "reply",
    ]);
  });

  it("stamps resolvedAt and keeps tickets inside their organization", async () => {
    const { id } = await ctx.asMember.tickets.create({
      subject: "Resolve me",
      requesterName: "Acme",
    });

    await ctx.asMember.tickets.update({ id, status: "resolved" });
    expect((await ctx.asMember.tickets.get({ id })).resolvedAt).not.toBeNull();

    await expect(other.asOwner.tickets.get({ id })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(
      other.asOwner.tickets.update({ id, status: "open" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("refuses an assignee from another organization and an unknown task", async () => {
    const { id } = await ctx.asMember.tickets.create({
      subject: "Assign",
      requesterName: "Acme",
    });

    await expect(
      ctx.asMember.tickets.update({ id, assigneeMemberId: other.memberId }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      ctx.asMember.tickets.linkTask({ id, taskKey: "NOPE-1" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("only lets people with tickets.delete remove a ticket", async () => {
    const { id } = await ctx.asMember.tickets.create({
      subject: "Delete me",
      requesterName: "Acme",
    });

    await expect(ctx.asMember.tickets.remove({ id })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(ctx.asOwner.tickets.remove({ id })).resolves.toEqual({ id });
  });
});

describe("hr", () => {
  let ctx: Awaited<ReturnType<typeof setup>>;
  let employeeId: string;

  beforeAll(async () => {
    ctx = await setup("People A");
    ({ id: employeeId } = await ctx.asOwner.hr.create(person(ctx.memberId)));
  });

  it("lets members read the directory but not change it", async () => {
    const directory = await ctx.asMember.hr.directory();

    expect(directory.canManage).toBe(false);
    expect(directory.people.map((p) => p.name)).toContain("Pat Member");
    expect(directory.myEmployeeId).toBe(employeeId);
    await expect(
      ctx.asMember.hr.create(person(null, "Sneaky")),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("will not link one account to two people", async () => {
    await expect(
      ctx.asOwner.hr.create(person(ctx.memberId, "Twin")),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("runs a leave request from request to decision", async () => {
    const { id } = await ctx.asMember.hr.leaveRequest({
      type: "annual",
      startDate: "2026-11-02",
      endDate: "2026-11-06",
      note: null,
    });

    await expect(
      ctx.asMember.hr.leaveDecide({ id, decision: "approved" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

    const mine = await ctx.asMember.hr.leaveList();

    expect(mine.requests).toHaveLength(1);
    expect(mine.requests[0]).toMatchObject({ days: 5, status: "pending" });

    await ctx.asOwner.hr.leaveDecide({ id, decision: "approved" });
    await expect(
      ctx.asOwner.hr.leaveDecide({ id, decision: "rejected" }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("rejects a weekend-only request", async () => {
    await expect(
      ctx.asMember.hr.leaveRequest({
        type: "annual",
        startDate: "2026-11-07",
        endDate: "2026-11-08",
        note: null,
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

describe("payroll", () => {
  let ctx: Awaited<ReturnType<typeof setup>>;
  let employeeId: string;
  let runId: string;

  beforeAll(async () => {
    ctx = await setup("Pay A");
    ({ id: employeeId } = await ctx.asOwner.hr.create(person(ctx.memberId)));
  });

  it("hides pay runs and salaries from members", async () => {
    await expect(ctx.asMember.payroll.runs()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(ctx.asMember.payroll.salaries()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(
      ctx.asMember.payroll.setSalary({
        employeeId,
        annualSalary: 1,
        currency: "USD",
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("needs a salary before a run can start", async () => {
    await expect(
      ctx.asOwner.payroll.createRun({
        label: "Empty",
        periodStart: "2026-11-01",
        periodEnd: "2026-11-30",
        deductionRateBps: 2000,
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("builds a run from salaries and recomputes pay when a bonus is set", async () => {
    await ctx.asOwner.payroll.setSalary({
      employeeId,
      annualSalary: 6_000_000,
      currency: "USD",
    });
    ({ id: runId } = await ctx.asOwner.payroll.createRun({
      label: "November 2026",
      periodStart: "2026-11-01",
      periodEnd: "2026-11-30",
      deductionRateBps: 2000,
    }));

    const run = await ctx.asOwner.payroll.run({ id: runId });

    expect(run.lines).toHaveLength(1);
    expect(run.lines[0]).toMatchObject({
      base: 500_000,
      bonus: 0,
      deductions: 100_000,
      net: 400_000,
    });

    await ctx.asOwner.payroll.setBonus({
      payslipId: run.lines[0]!.id,
      bonus: 100_000,
    });

    const updated = await ctx.asOwner.payroll.run({ id: runId });

    expect(updated.lines[0]).toMatchObject({
      deductions: 120_000,
      net: 480_000,
    });
  });

  it("shows a member their payslip only after approval", async () => {
    expect(await ctx.asMember.payroll.mine()).toEqual([]);

    await ctx.asOwner.payroll.approveRun({ id: runId });

    const slips = await ctx.asMember.payroll.mine();

    expect(slips).toHaveLength(1);
    expect(slips[0]).toMatchObject({ net: 480_000, status: "approved" });
  });

  it("freezes a run once it is approved", async () => {
    const run = await ctx.asOwner.payroll.run({ id: runId });

    await expect(
      ctx.asOwner.payroll.setBonus({ payslipId: run.lines[0]!.id, bonus: 1 }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    await expect(
      ctx.asOwner.payroll.approveRun({ id: runId }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    await expect(
      ctx.asOwner.payroll.deleteRun({ id: runId }),
    ).rejects.toMatchObject({ code: "CONFLICT" });

    await ctx.asOwner.payroll.markPaid({ id: runId });
    expect((await ctx.asOwner.payroll.run({ id: runId })).status).toBe("paid");
  });
});

describe("admin", () => {
  it("is closed to members and open to owners", async () => {
    const ctx = await setup("Admin A");

    await expect(ctx.asMember.admin.overview()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });

    const overview = await ctx.asOwner.admin.overview();

    expect(overview.members).toBe(2);
    expect(overview.setup.map((step) => step.id)).toContain("logo");
    expect((await ctx.asOwner.admin.usage()).uploaders).toEqual([]);
    expect(
      (await ctx.asOwner.admin.security()).privileged.map((p) => p.role),
    ).toContain("owner");
  });
});
