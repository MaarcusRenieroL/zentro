import { TRPCError } from "@trpc/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { World, type TestOrg } from "./helpers";

const world = new World();

afterAll(() => world.cleanup());

type Caller = Awaited<ReturnType<World["caller"]>>;

describe("tasks and docs link to each other", () => {
  let org: TestOrg;
  let owner: Caller;
  let member: Caller;
  let memberId: string;
  let projectId: string;
  let a: { key: string; id: string };
  let b: { key: string; id: string };
  let doc: { id: string; slug: string };

  beforeAll(async () => {
    org = await world.org("Links");
    const o = await world.userIn(org, "owner", "Olive Owner");
    const m = await world.userIn(org, "member", "Max Member");

    memberId = m.member.id;
    owner = await world.caller(o.user, org);
    member = await world.caller(m.user, org);
    projectId = (
      await owner.project.createProject({
        name: "Linked",
        slug: "linked",
        description: "",
      })
    ).id;
    a = await owner.task.createTask({ projectId, name: "Fix the login loop" });
    b = await owner.task.createTask({ projectId, name: "Ship billing" });
    doc = await owner.docs.create({
      projectId,
      title: "Session spec",
      slug: "session-spec",
    });
  });

  it("records blocks both ways and a related doc", async () => {
    await owner.link.addFromTask({
      taskKey: a.key,
      target: { type: "task", key: b.key },
      kind: "blocks",
    });
    await owner.link.addFromTask({
      taskKey: a.key,
      target: { type: "doc", id: doc.id },
      kind: "relates",
    });

    const fromA = await owner.link.forTask({ taskKey: a.key });
    const fromB = await owner.link.forTask({ taskKey: b.key });
    const fromDoc = await owner.link.forDoc({ docId: doc.id });

    expect(fromA.map((item) => [item.relation, item.title])).toEqual(
      expect.arrayContaining([
        ["blocks", "Ship billing"],
        ["relates", "Session spec"],
      ]),
    );
    expect(fromB).toMatchObject([{ relation: "blocked_by", key: a.key }]);
    expect(fromDoc).toMatchObject([{ relation: "relates", key: a.key }]);

    // The task list says what blocks each task.
    const list = await owner.task.getTasksByOrgId({});

    expect(list.find((task) => task.key === b.key)?.blockedBy).toEqual([a.key]);
    expect(list.find((task) => task.key === a.key)?.blockedBy).toEqual([]);
  });

  it("does not duplicate a link, in either direction for related", async () => {
    await owner.link.addFromDoc({
      docId: doc.id,
      target: { type: "task", key: a.key },
    });

    expect(await owner.link.forDoc({ docId: doc.id })).toHaveLength(1);
  });

  it("refuses self links and docs that block", async () => {
    await expect(
      owner.link.addFromTask({
        taskKey: a.key,
        target: { type: "task", key: a.key },
        kind: "relates",
      }),
    ).rejects.toBeInstanceOf(TRPCError);
    await expect(
      owner.link.addFromTask({
        taskKey: a.key,
        target: { type: "doc", id: doc.id },
        kind: "blocks",
      }),
    ).rejects.toThrow(/Only tasks can block/);
  });

  it("links task keys named in a doc, and unlinks them when removed", async () => {
    await owner.docs.updateDocContent({
      id: doc.id,
      content: `Root cause is in ${b.key}.`,
    });

    expect(
      (await owner.link.forTask({ taskKey: b.key })).filter(
        (item) => item.relation === "mentioned_in",
      ),
    ).toMatchObject([{ type: "doc", title: "Session spec", auto: true }]);

    await owner.docs.updateDocContent({ id: doc.id, content: "No keys." });

    expect(
      (await owner.link.forTask({ taskKey: b.key })).filter(
        (item) => item.relation === "mentioned_in",
      ),
    ).toEqual([]);
  });

  it("links keys from descriptions and comments", async () => {
    await owner.task.updateTaskByKey({
      key: b.key,
      description: `Waits on ${a.key}`,
    });
    await owner.comment.createTaskComment({
      taskKey: a.key,
      body: `See ${b.key} too`,
    });

    const relations = (await owner.link.forTask({ taskKey: a.key })).map(
      (item) => item.relation,
    );

    expect(relations).toEqual(
      expect.arrayContaining(["mentioned_in", "mentions"]),
    );
  });

  it("keeps mention links out of manual removal", async () => {
    const auto = (await owner.link.forTask({ taskKey: a.key })).find(
      (item) => item.auto,
    )!;

    await expect(owner.link.remove({ linkId: auto.linkId })).rejects.toThrow(
      /mention/,
    );
  });

  it("tells the assignee when their task is named in a doc", async () => {
    await owner.task.updateTaskByKey({
      key: b.key,
      assignedToMemberId: memberId,
    });
    await owner.docs.updateDocContent({
      id: doc.id,
      content: `Now tracked in ${b.key}.`,
    });

    const items = await member.notification.list();

    expect(items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "mention",
          verb: `linked ${b.key} in`,
          object: "Session spec",
        }),
      ]),
    );
  });

  it("lets an editor remove a manual link", async () => {
    const blocks = (await owner.link.forTask({ taskKey: a.key })).find(
      (item) => item.relation === "blocks",
    )!;

    await owner.link.remove({ linkId: blocks.linkId });

    expect(
      (await owner.link.forTask({ taskKey: b.key })).some(
        (item) => item.relation === "blocked_by",
      ),
    ).toBe(false);
  });

  it("links a task made from a doc, and a doc written for a task", async () => {
    const fromDoc = await owner.task.createTask({
      projectId,
      name: "Follow-up from the spec",
      linkDocId: doc.id,
    });
    const spec = await owner.docs.create({
      projectId,
      title: "Spec for billing",
      slug: "spec-for-billing",
      linkTaskKey: b.key,
    });

    expect(await owner.link.forTask({ taskKey: fromDoc.key })).toMatchObject([
      { relation: "relates", type: "doc", title: "Session spec" },
    ]);
    expect(await owner.link.forDoc({ docId: spec.id })).toMatchObject([
      { relation: "relates", type: "task", key: b.key },
    ]);
  });

  it("hides links to work the caller cannot see", async () => {
    const secret = await owner.project.createProject({
      name: "Secret",
      slug: "secret-links",
      description: "",
    });

    await owner.project.updateAccess({
      slug: secret.slug,
      visibility: "private",
      teamId: null,
    });

    const hidden = await owner.task.createTask({
      projectId: secret.id,
      name: "Hidden work",
    });

    await owner.link.addFromTask({
      taskKey: a.key,
      target: { type: "task", key: hidden.key },
      kind: "relates",
    });

    const asOwner = await owner.link.forTask({ taskKey: a.key });
    const asMember = await member.link.forTask({ taskKey: a.key });

    expect(asOwner.some((item) => item.key === hidden.key)).toBe(true);
    expect(asMember.some((item) => item.key === hidden.key)).toBe(false);
    // Nor can the member link to it.
    await expect(
      member.link.addFromTask({
        taskKey: a.key,
        target: { type: "task", key: hidden.key },
        kind: "relates",
      }),
    ).rejects.toBeInstanceOf(TRPCError);
  });
});
