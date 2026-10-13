import { db } from "@zentro/db";
import { eq } from "@zentro/db/drizzle";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { tasks } from "@zentro/db/schema";

import { World, type TestOrg, type TestUser } from "./helpers";

const world = new World();

type Caller = Awaited<ReturnType<World["caller"]>>;

const day = 24 * 60 * 60 * 1000;

let org: TestOrg;
let other: TestOrg;
let me: TestUser;
let myMemberId: string;
let teammate: TestUser;
let teammateMemberId: string;
let asMe: Caller;

beforeAll(async () => {
  org = await world.org("Overview Org");
  other = await world.org("Other Org");

  const mine = await world.userIn(org, "owner", "Olivia Owner");
  const theirs = await world.userIn(org, "member", "Tom Teammate");

  me = mine.user;
  myMemberId = mine.member.id;
  teammate = theirs.user;
  teammateMemberId = theirs.member.id;

  asMe = await world.caller(me, org);

  const project = await world.project(org, { taskKeyPrefix: "OV" });
  const team = await world.team(org, { name: "Platform" });

  // 1: mine, high, overdue
  await world.task(org, project, {
    taskNumber: 1,
    name: "Overdue mine",
    priority: "high",
    status: "in-progress",
    assignedToMemberId: myMemberId,
    createdByMemberId: myMemberId,
    dueAt: new Date(Date.now() - 2 * day),
  });
  // 2: mine, medium, due in 3 days
  await world.task(org, project, {
    taskNumber: 2,
    name: "Due soon mine",
    priority: "medium",
    status: "todo",
    assignedToMemberId: myMemberId,
    createdByMemberId: teammateMemberId,
    dueAt: new Date(Date.now() + 3 * day),
  });
  // 3: mine but done, must not appear in "assigned to me"
  await world.task(org, project, {
    taskNumber: 3,
    name: "Finished mine",
    priority: "low",
    status: "done",
    assignedToMemberId: myMemberId,
  });
  // 4: someone else's, due in 20 days
  await world.task(org, project, {
    taskNumber: 4,
    name: "Theirs",
    priority: "medium",
    status: "review",
    assignedToMemberId: teammateMemberId,
    teamId: team.id,
    dueAt: new Date(Date.now() + 20 * day),
  });
  // 5: old task, created and updated long ago
  await world.task(org, project, {
    taskNumber: 5,
    name: "Old backlog",
    priority: "low",
    status: "backlog",
    createdAt: new Date(Date.now() - 30 * day),
    updatedAt: new Date(Date.now() - 30 * day),
  });

  // Data in another organization must never show up.
  const otherOwner = await world.userIn(other, "owner", "Other Owner");
  const otherProject = await world.project(other, { taskKeyPrefix: "ZZ" });

  await world.task(other, otherProject, {
    taskNumber: 1,
    name: "Other org overdue",
    priority: "high",
    status: "todo",
    assignedToMemberId: otherOwner.member.id,
    dueAt: new Date(Date.now() - day),
  });
});

afterAll(() => world.cleanup());

describe("task.getOverview", () => {
  it("counts tasks by status and priority for the active organization only", async () => {
    const overview = await asMe.task.getOverview();
    const byStatus = Object.fromEntries(
      overview.byStatus.map((row) => [row.status, row.count]),
    );
    const byPriority = Object.fromEntries(
      overview.byPriority.map((row) => [row.priority, row.count]),
    );

    expect(byStatus).toEqual({
      "in-progress": 1,
      todo: 1,
      done: 1,
      review: 1,
      backlog: 1,
    });
    expect(byPriority).toEqual({ high: 1, medium: 2, low: 2 });
  });

  it("computes the 7-day counts from real data", async () => {
    const { counts } = await asMe.task.getOverview();

    // Tasks 1-4 were just inserted (task 3 is done but its completion was not
    // recorded as an event); task 5 is 30 days old.
    expect(counts).toMatchObject({
      createdLast7Days: 4,
      updatedLast7Days: 4,
      completedLast7Days: 0,
      dueNext7Days: 1,
      overdue: 1,
    });
  });

  it("lists only my open tasks, soonest due first", async () => {
    const { assignedToMe } = await asMe.task.getOverview();

    expect(assignedToMe.map((task) => task.key)).toEqual(["OV-1", "OV-2"]);
  });

  it("lists overdue tasks and recently updated tasks", async () => {
    const { overdue, recentlyUpdated } = await asMe.task.getOverview();

    expect(overdue.map((task) => task.key)).toEqual(["OV-1"]);
    expect(recentlyUpdated.map((task) => task.key)).not.toContain("ZZ-1");
    expect(recentlyUpdated.at(-1)?.key).toBe("OV-5");
  });

  it("counts a status change to done as completed", async () => {
    const project = await world.project(org, { taskKeyPrefix: "CP" });
    const task = await world.task(org, project, {
      taskNumber: 1,
      name: "Will complete",
      status: "todo",
    });

    await asMe.task.updateTaskByKey({ key: task.key, status: "done" });

    const { counts, activity } = await asMe.task.getOverview();

    expect(counts.completedLast7Days).toBe(1);
    expect(activity[0]).toMatchObject({
      type: "task.updated",
      field: "status",
      toValue: "done",
      actor: "Olivia Owner",
      taskKey: "CP-1",
    });
  });

  it("gives another user their own assigned tasks", async () => {
    const asTeammate = await world.caller(teammate, org);
    const { assignedToMe } = await asTeammate.task.getOverview();

    expect(assignedToMe.map((task) => task.key)).toEqual(["OV-4"]);
  });

  it("is empty for an organization without tasks", async () => {
    const empty = await world.org("Empty Org");
    const { user } = await world.userIn(empty, "owner");
    const overview = await (await world.caller(user, empty)).task.getOverview();

    expect(overview).toMatchObject({
      counts: {
        createdLast7Days: 0,
        updatedLast7Days: 0,
        completedLast7Days: 0,
        dueNext7Days: 0,
        overdue: 0,
      },
      byStatus: [],
      byPriority: [],
      assignedToMe: [],
      overdue: [],
      recentlyUpdated: [],
      activity: [],
    });
  });

  it("is blocked when the tasks module is off", async () => {
    const guarded = await world.org("Guarded Overview");
    const { user } = await world.userIn(guarded, "owner");

    await world.setModule(guarded, "tasks", false);

    await expect(
      (await world.caller(user, guarded)).task.getOverview(),
    ).rejects.toMatchObject({ code: "FORBIDDEN", message: "Module disabled" });
  });
});

describe("task.getTaskByKey reporter", () => {
  it("returns the creator's name as the reporter", async () => {
    const created = await asMe.task.createTask({
      projectId: (await world.project(org, { taskKeyPrefix: "RP" })).id,
      name: "Reported",
    });
    const detail = await asMe.task.getTaskByKey({ key: created.key });

    expect(detail?.reporter).toBe("Olivia Owner");
  });

  it("returns the team name and a null reporter when there is no creator", async () => {
    const [seeded] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.name, "Theirs"));
    const detail = await asMe.task.getTaskByKey({ key: seeded!.key });

    expect(detail).toMatchObject({ teamName: "Platform", reporter: null });
  });
});
