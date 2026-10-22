import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { World, type TestOrg } from "./helpers";

const world = new World();

afterAll(() => world.cleanup());

type Caller = Awaited<ReturnType<World["caller"]>>;

describe("chat connects to tasks and the inbox", () => {
  let org: TestOrg;
  let owner: Caller;
  let member: Caller;
  let ownerId: string;
  let memberId: string;
  let projectId: string;
  let task: { id: string; key: string };
  let channel: { id: string };

  beforeAll(async () => {
    org = await world.org("Linked chat");
    const o = await world.userIn(org, "owner", "Priya Raman");
    const m = await world.userIn(org, "member", "Arjun Mehta");

    owner = await world.caller(o.user, org);
    member = await world.caller(m.user, org);
    ownerId = o.member.id;
    memberId = m.member.id;
    projectId = (
      await owner.project.createProject({
        name: "Billing",
        slug: "billing-chat",
        description: "",
      })
    ).id;
    task = await owner.task.createTask({ projectId, name: "Fix proration" });
    channel = await owner.chat.create({
      name: "billing",
      link: { type: "project", id: projectId },
      memberIds: [memberId],
    });
  });

  it("shows the channel a project is linked to, and which project", async () => {
    const sidebar = await owner.chat.sidebar();

    expect(
      sidebar.channels.find((entry) => entry.id === channel.id)?.link,
    ).toMatchObject({ type: "project", name: "Billing" });
    // The project already had a channel of its own; "billing" is a second.
    const linked = await owner.chat.linkedTo({
      type: "project",
      id: projectId,
    });

    expect(linked.map((entry) => entry.name).sort()).toEqual([
      "billing",
      "project-billing-chat",
    ]);
    expect(linked.every((entry) => entry.joined)).toBe(true);
  });

  it("turns a task key in a message into a card and a link on the task", async () => {
    const message = await member.chat.send({
      channelId: channel.id,
      body: `Can someone look at ${task.key}?`,
    });

    expect(message.tasks).toMatchObject([
      { key: task.key, name: "Fix proration" },
    ]);

    const links = await owner.link.forTask({ taskKey: task.key });

    expect(links).toMatchObject([
      {
        type: "message",
        relation: "mentioned_in",
        key: "#billing",
        href: `/chat/billing?m=${message.id}`,
      },
    ]);

    // Editing the key out of the message removes the link.
    await member.chat.edit({ messageId: message.id, body: "Never mind" });
    expect(await owner.link.forTask({ taskKey: task.key })).toEqual([]);
  });

  it("links a task made from a message back to it", async () => {
    const message = await member.chat.send({
      channelId: channel.id,
      body: "We should add a retry for failed charges",
    });
    const created = await member.task.createTask({
      projectId,
      name: "Retry failed charges",
      linkMessageId: message.id,
    });

    expect(await member.link.forTask({ taskKey: created.key })).toMatchObject([
      { type: "message", relation: "relates" },
    ]);
  });

  it("keeps a private conversation's messages out of linked work", async () => {
    const secret = await owner.chat.create({
      name: "secret-billing",
      visibility: "private",
    });

    await owner.chat.send({
      channelId: secret.id,
      body: `Layoffs affect ${task.key}`,
    });

    const links = await member.link.forTask({ taskKey: task.key });

    expect(links.some((item) => item.key === "#secret-billing")).toBe(false);
  });

  it("puts chat mentions and direct messages in the inbox, unless muted", async () => {
    await owner.chat.send({
      channelId: channel.id,
      body: `<@${memberId}> please check the report`,
    });

    const dm = await owner.chat.openDm({ memberIds: [memberId] });

    await owner.chat.send({ channelId: dm.id, body: "Quick question" });

    let items = await member.notification.list();

    expect(items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "mention",
          verb: "mentioned you in",
          object: "#billing",
        }),
        expect.objectContaining({
          verb: "sent you a message in",
          quote: "Quick question",
        }),
      ]),
    );

    await member.chat.setPreferences({ channelId: dm.id, notify: "mute" });
    items = await member.notification.list();
    expect(items.some((item) => item.quote === "Quick question")).toBe(false);
    expect(ownerId).not.toBe(memberId);
  });
});
