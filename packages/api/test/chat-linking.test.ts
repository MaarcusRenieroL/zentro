import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { World, type TestOrg } from "./helpers";

const world = new World();

afterAll(() => world.cleanup());

type Caller = Awaited<ReturnType<World["caller"]>>;

describe("chat links to tasks, docs and projects", () => {
  let org: TestOrg;
  let owner: Caller;
  let member: Caller;
  let outsider: Caller;
  let memberId: string;
  let projectId: string;
  let task: { id: string; key: string };
  let doc: { id: string; slug: string };

  beforeAll(async () => {
    org = await world.org("Linking");
    const o = await world.userIn(org, "owner", "Priya Raman");
    const m = await world.userIn(org, "member", "Arjun Mehta");
    const x = await world.userIn(org, "member", "Meera Iyer");

    owner = await world.caller(o.user, org);
    member = await world.caller(m.user, org);
    outsider = await world.caller(x.user, org);
    memberId = m.member.id;
    projectId = (
      await owner.project.createProject({
        name: "Billing",
        slug: "billing-link",
        description: "",
      })
    ).id;
    task = await owner.task.createTask({ projectId, name: "Fix proration" });
    doc = await world.doc(org, { title: "Pricing spec", slug: "pricing-spec" });
  });

  it("opens a private discussion for a task, once, for people who can see it", async () => {
    const first = await owner.chat.discuss({ type: "task", id: task.id });

    expect(first).toMatchObject({ created: true });
    expect(first.name).toMatch(/^task-/);

    const again = await member.chat.discuss({ type: "task", id: task.id });

    expect(again).toMatchObject({ created: false, channelId: first.channelId });

    const summary = await member.chat.discussion({
      type: "task",
      id: task.id,
    });

    expect(summary).toMatchObject({ exists: true, joined: true });
    // A private channel is not offered to people browsing channels.
    expect(
      (await outsider.chat.browse()).map((entry) => entry.name),
    ).not.toContain(first.name);
  });

  it("shows a discussion's link label in the sidebar", async () => {
    const channel = (await owner.chat.sidebar()).channels.find((entry) =>
      entry.name?.startsWith("task-"),
    );

    expect(channel?.link).toMatchObject({
      type: "task",
      key: task.key,
      href: `/tasks/${task.key}`,
    });
  });

  it("opens discussions for a doc and a project, and refuses what you cannot see", async () => {
    expect(await owner.chat.discuss({ type: "doc", id: doc.id })).toMatchObject(
      { created: true },
    );
    // A new project already has a channel, so this opens it rather than
    // making a second one.
    expect(
      await owner.chat.discuss({ type: "project", id: projectId }),
    ).toMatchObject({ created: false, name: "project-billing-link" });

    await expect(
      owner.chat.discuss({
        type: "task",
        id: "00000000-0000-4000-8000-000000000000",
      }),
    ).rejects.toThrow(/not found/);
  });

  it("turns a doc or project link into a card, and hides what the viewer cannot open", async () => {
    const channel = await owner.chat.create({ name: "cards" });
    const message = await owner.chat.send({
      channelId: channel.id,
      body: `Spec: /docs/${doc.slug} and /projects/billing-link and /docs/no-such-doc`,
    });

    expect(message.entities).toMatchObject([
      { type: "doc", title: "Pricing spec", href: `/docs/${doc.slug}` },
      { type: "project", title: "Billing", href: "/projects/billing-link" },
    ]);
    // An address that matches nothing is not a card.
    expect(message.entities).toHaveLength(2);

    // Links on another site are not ours to resolve.
    const external = await owner.chat.send({
      channelId: channel.id,
      body: `See https://example.com/docs/${doc.slug}`,
    });

    expect(external.entities).toEqual([]);
  });

  it("quotes a link to another message, but not one the viewer cannot read", async () => {
    const open = await owner.chat.create({ name: "open-room" });
    const secret = await owner.chat.create({
      name: "secret-room",
      visibility: "private",
    });
    const said = await owner.chat.send({
      channelId: secret.id,
      body: "Salary bands are attached",
    });
    const visible = await owner.chat.send({
      channelId: open.id,
      body: "Everyone can read this one",
    });
    const shared = await owner.chat.send({
      channelId: open.id,
      body: `See /chat/open-room?m=${visible.id} and /chat/secret-room?m=${said.id}`,
    });

    // The owner is in both rooms and sees both quotes.
    expect(shared.entities).toMatchObject([
      { type: "message", excerpt: "Everyone can read this one" },
      { type: "message", subtitle: "#secret-room" },
    ]);

    // Someone who cannot read the private room sees only that it is hidden.
    const asOutsider = (
      await outsider.chat.messages({ channelId: open.id })
    ).messages.find((entry) => entry.id === shared.id)!;

    expect(asOutsider.entities).toMatchObject([
      { type: "message", excerpt: "Everyone can read this one" },
      { type: "missing" },
    ]);
    expect(JSON.stringify(asOutsider.entities)).not.toContain("Salary");
  });

  it("searches tasks, docs and projects to link", async () => {
    const result = await owner.chat.linkSearch({ q: "pr" });

    expect(result.tasks.map((entry) => entry.key)).toContain(task.key);
    expect(result.docs.map((entry) => entry.slug)).toContain(doc.slug);
    expect(result.projects.map((entry) => entry.slug)).not.toContain(
      "billing-link",
    );
    expect(
      (await owner.chat.linkSearch({ q: "bill" })).projects.map(
        (entry) => entry.slug,
      ),
    ).toContain("billing-link");
  });

  it("shows the task created from a message as a card on that message", async () => {
    const channel = await owner.chat.create({
      name: "triage",
      memberIds: [memberId],
    });
    const message = await member.chat.send({
      channelId: channel.id,
      body: "The export button is broken",
    });
    const created = await owner.task.createTask({
      projectId,
      name: "Fix export button",
      linkMessageId: message.id,
    });
    const after = (
      await owner.chat.messages({ channelId: channel.id })
    ).messages.find((entry) => entry.id === message.id)!;

    expect(after.tasks).toMatchObject([
      { key: created.key, name: "Fix export button" },
    ]);

    // Finishing the task answers in the message's thread.
    await owner.task.updateTaskByKey({ key: created.key, status: "done" });

    const thread = await owner.chat.thread({ messageId: message.id });

    expect(thread.replies).toMatchObject([
      { kind: "event", body: `marked ${created.key} as done` },
    ]);
  });

  it("posts task events to a project channel that asked for them", async () => {
    const channel = await owner.chat.create({
      name: "billing-feed",
      link: { type: "project", id: projectId },
    });

    await expect(
      owner.chat.feedSet({
        channelId: channel.id,
        enabled: true,
        events: ["created", "done"],
      }),
    ).resolves.toEqual({ ok: true });
    expect(await owner.chat.feedGet({ channelId: channel.id })).toEqual({
      enabled: true,
      events: ["created", "done"],
    });

    const created = await owner.task.createTask({ projectId, name: "Ship it" });
    const feed = await owner.chat.messages({ channelId: channel.id });

    expect(feed.messages).toMatchObject([
      { kind: "event", body: `created ${created.key} · Ship it` },
    ]);
    // The event carries the task key, so it shows as a card too.
    expect(feed.messages[0]!.tasks).toMatchObject([{ key: created.key }]);

    // Events the channel did not pick are not posted.
    await owner.task.updateTaskByKey({
      key: created.key,
      assignedToMemberId: memberId,
    });
    expect(
      (await owner.chat.messages({ channelId: channel.id })).messages,
    ).toHaveLength(1);

    await owner.task.updateTaskByKey({ key: created.key, status: "done" });
    expect(
      (await owner.chat.messages({ channelId: channel.id })).messages,
    ).toHaveLength(2);
  });

  it("posts a subtask's creation to the feed too", async () => {
    const channel = await owner.chat.create({
      name: "feed-subtasks",
      link: { type: "project", id: projectId },
    });

    await owner.chat.feedSet({
      channelId: channel.id,
      enabled: true,
      events: ["created"],
    });

    const parent = await owner.task.createTask({ projectId, name: "Parent" });
    const before = (await owner.chat.messages({ channelId: channel.id }))
      .messages.length;
    const sub = await owner.task.createSubtask({
      parentTaskKey: parent.key,
      name: "Child step",
    });
    const after = (await owner.chat.messages({ channelId: channel.id }))
      .messages;

    expect(after).toHaveLength(before + 1);
    expect(after.at(-1)!.body).toBe(`created ${sub.key} · Child step`);
  });

  it("needs a linked project for the feed, and only channel admins set it", async () => {
    const plain = await owner.chat.create({ name: "not-linked" });

    await expect(
      owner.chat.feedSet({
        channelId: plain.id,
        enabled: true,
        events: ["done"],
      }),
    ).rejects.toThrow(/project/);

    const linked = await owner.chat.create({
      name: "linked-two",
      link: { type: "project", id: projectId },
      memberIds: [memberId],
    });

    await expect(
      member.chat.feedSet({
        channelId: linked.id,
        enabled: true,
        events: ["done"],
      }),
    ).rejects.toThrow(/admins/);
  });

  it("runs a chat automation: a matching message makes a task and says so", async () => {
    const channel = await owner.chat.create({ name: "bug-reports" });

    await expect(
      owner.automation.create({
        name: "Bug to task",
        triggerEvent: "chat.message_contains",
        triggerConfig: {},
        actionType: "create_task",
        actionConfig: {},
        projectId,
      }),
    ).rejects.toThrow(/words/);
    await expect(
      owner.automation.create({
        name: "No project",
        triggerEvent: "chat.message_contains",
        triggerConfig: { contains: "bug:" },
        actionType: "create_task",
        actionConfig: {},
      }),
    ).rejects.toThrow(/project/);

    await owner.automation.create({
      name: "Bug to task",
      triggerEvent: "chat.message_contains",
      triggerConfig: { contains: "bug:", channelId: channel.id },
      actionType: "create_task",
      actionConfig: {},
      projectId,
    });

    const quiet = await owner.chat.send({
      channelId: channel.id,
      body: "Just chatting",
    });
    const report = await owner.chat.send({
      channelId: channel.id,
      body: "BUG: export fails on Safari",
    });
    const thread = await owner.chat.thread({ messageId: report.id });

    expect(thread.replies).toHaveLength(1);
    expect(thread.replies[0]!.body).toMatch(
      /created [A-Z0-9]+-\d+ from this message/,
    );
    expect(
      (await owner.chat.thread({ messageId: quiet.id })).replies,
    ).toHaveLength(0);

    const after = (
      await owner.chat.messages({ channelId: channel.id })
    ).messages.find((entry) => entry.id === report.id)!;

    expect(after.tasks).toMatchObject([
      { name: "BUG: export fails on Safari" },
    ]);

    // A rule scoped to one channel ignores the same words elsewhere.
    const other = await owner.chat.create({ name: "elsewhere" });
    const ignored = await owner.chat.send({
      channelId: other.id,
      body: "bug: not here",
    });

    expect(
      (await owner.chat.thread({ messageId: ignored.id })).replies,
    ).toHaveLength(0);
  });

  it("refuses a post-to-channel rule for a channel the creator cannot post in", async () => {
    const closed = await owner.chat.create({
      name: "owners-only",
      visibility: "private",
    });

    await expect(
      member.automation.create({
        name: "Sneaky",
        triggerEvent: "task.created",
        triggerConfig: {},
        actionType: "post_to_channel",
        actionConfig: { channelId: closed.id },
      }),
    ).rejects.toThrow();
  });

  it("finds where a file was shared", async () => {
    expect(
      await owner.chat.fileDiscussions({
        fileId: "00000000-0000-4000-8000-000000000000",
      }),
    ).toEqual([]);
  });
});
