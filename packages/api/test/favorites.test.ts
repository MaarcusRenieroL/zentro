import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { World, type TestOrg } from "./helpers";

const world = new World();

afterAll(() => world.cleanup());

type Caller = Awaited<ReturnType<World["caller"]>>;

describe("favorites are personal and follow access", () => {
  let org: TestOrg;
  let owner: Caller;
  let member: Caller;
  let project: { id: string; slug: string };
  let secret: { id: string; slug: string };
  let docId: string;
  let task: { id: string; key: string };

  beforeAll(async () => {
    org = await world.org("Stars");
    const o = await world.userIn(org, "owner", "Olive Owner");
    const m = await world.userIn(org, "member", "Max Member");

    owner = await world.caller(o.user, org);
    member = await world.caller(m.user, org);
    project = await owner.project.createProject({
      name: "Starred",
      slug: "starred",
      description: "",
    });
    secret = await owner.project.createProject({
      name: "Secret",
      slug: "secret-stars",
      description: "",
    });
    docId = (
      await owner.docs.create({
        projectId: project.id,
        title: "Plan",
        slug: "plan-stars",
      })
    ).id;
    task = await owner.task.createTask({
      projectId: project.id,
      name: "Do it",
    });
  });

  it("stars and unstars projects, docs and tasks", async () => {
    expect(
      await member.favorite.toggle({ type: "project", id: project.id }),
    ).toEqual({ favorite: true });
    await member.favorite.toggle({ type: "doc", id: docId });
    await member.favorite.toggle({ type: "task", id: task.id });

    expect(
      (await member.favorite.list()).map((item) => [item.type, item.title]),
    ).toEqual([
      ["project", "Starred"],
      ["doc", "Plan"],
      ["task", "Do it"],
    ]);
    // Someone else's stars are their own.
    expect(await owner.favorite.list()).toEqual([]);

    expect(await member.favorite.toggle({ type: "doc", id: docId })).toEqual({
      favorite: false,
    });
    expect((await member.favorite.list()).map((item) => item.type)).toEqual([
      "project",
      "task",
    ]);
  });

  it("drops a star when access goes, and refuses what cannot be seen", async () => {
    await member.favorite.toggle({ type: "project", id: secret.id });
    await owner.project.updateAccess({
      slug: secret.slug,
      visibility: "private",
      teamId: null,
    });

    expect(
      (await member.favorite.list()).some((item) => item.id === secret.id),
    ).toBe(false);
    await expect(
      member.favorite.toggle({ type: "project", id: secret.id }),
    ).rejects.toThrow();
  });
});
