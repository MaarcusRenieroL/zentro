import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { World, type TestOrg } from "./helpers";

const world = new World();

afterAll(() => world.cleanup());

type Caller = Awaited<ReturnType<World["caller"]>>;

describe("the inbox is built from assignments, comments and mentions", () => {
  let org: TestOrg;
  let owner: Caller;
  let member: Caller;
  let memberId: string;
  let projectId: string;

  beforeAll(async () => {
    org = await world.org("Inbox");
    const o = await world.userIn(org, "owner", "Olive Owner");
    const m = await world.userIn(org, "member", "Max Member");

    memberId = m.member.id;
    owner = await world.caller(o.user, org);
    member = await world.caller(m.user, org);
    projectId = (
      await owner.project.createProject({
        name: "Inbox project",
        slug: "inbox-project",
        description: "",
      })
    ).id;
  });

  it("starts empty", async () => {
    expect(await member.notification.list()).toEqual([]);
  });

  it("shows an assignment, a comment on your task and a mention, unread", async () => {
    const assigned = await owner.task.createTask({
      projectId,
      name: "Ship the inbox",
    });

    await owner.task.updateTaskByKey({
      key: assigned.key,
      assignedToMemberId: memberId,
    });
    await owner.comment.createTaskComment({
      taskKey: assigned.key,
      body: "Looks close",
    });

    const other = await owner.task.createTask({ projectId, name: "Other" });

    await owner.comment.createTaskComment({
      taskKey: other.key,
      body: "@Max can you check this?",
    });
    // Someone else's task without a mention is not yours.
    await owner.comment.createTaskComment({
      taskKey: other.key,
      body: "Note to self",
    });

    const items = await member.notification.list();

    expect(items.map((item) => [item.kind, item.object])).toEqual([
      ["mention", other.key],
      ["comment", assigned.key],
      ["assignment", assigned.key],
    ]);
    expect(items.every((item) => item.unread)).toBe(true);
    expect(items[0]).toMatchObject({
      actor: "Olive Owner",
      verb: "mentioned you in",
      quote: "@Max can you check this?",
      href: `/tasks/${other.key}`,
    });
  });

  it("never notifies you about your own actions", async () => {
    expect(await owner.notification.list()).toEqual([]);
  });

  it("keeps read marks, one by one and all at once", async () => {
    const [first] = await member.notification.list();

    await member.notification.markRead({ id: first!.id });

    const afterOne = await member.notification.list();

    expect(afterOne.find((item) => item.id === first!.id)?.unread).toBe(false);
    expect(afterOne.filter((item) => item.unread)).toHaveLength(2);

    await member.notification.markAllRead();

    expect(
      (await member.notification.list()).filter((item) => item.unread),
    ).toHaveLength(0);
  });
});
