import { TRPCError } from "@trpc/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { World, type TestOrg } from "./helpers";

const world = new World();

afterAll(() => world.cleanup());

type Caller = Awaited<ReturnType<World["caller"]>>;

describe("chat channels, messages and threads", () => {
  let org: TestOrg;
  let owner: Caller;
  let arjun: Caller;
  let meera: Caller;
  let ownerId: string;
  let arjunId: string;
  let meeraId: string;
  let platform: { id: string; name: string };

  beforeAll(async () => {
    org = await world.org("Chatty");
    const o = await world.userIn(org, "owner", "Priya Raman");
    const a = await world.userIn(org, "member", "Arjun Mehta");
    const m = await world.userIn(org, "member", "Meera Iyer");

    owner = await world.caller(o.user, org);
    arjun = await world.caller(a.user, org);
    meera = await world.caller(m.user, org);
    ownerId = o.member.id;
    arjunId = a.member.id;
    meeraId = m.member.id;
  });

  it("creates a public channel, with the creator as admin", async () => {
    platform = await owner.chat.create({
      name: "Platform",
      topic: "Auth and the API gateway",
      memberIds: [arjunId],
    });

    expect(platform.name).toBe("platform");

    const channel = await owner.chat.get({ name: "platform" });

    expect(channel).toMatchObject({
      access: "full",
      role: "admin",
      canManage: true,
      topic: "Auth and the API gateway",
    });
    await expect(owner.chat.create({ name: "platform" })).rejects.toThrow(
      /already exists/,
    );
  });

  it("lets anyone read and join a public channel, and posting joins it", async () => {
    expect((await meera.chat.browse()).map((entry) => entry.name)).toContain(
      "platform",
    );

    await meera.chat.send({ channelId: platform.id, body: "Hi all" });

    expect(
      (await meera.chat.sidebar()).channels.map((entry) => entry.name),
    ).toContain("platform");
  });

  it("hides private channels except for who can add you", async () => {
    const secret = await owner.chat.create({
      name: "leadership",
      visibility: "private",
    });

    const view = await arjun.chat.get({ name: "leadership" });

    expect(view).toMatchObject({
      access: "none",
      admins: [{ name: "Priya Raman" }],
    });
    await expect(
      arjun.chat.messages({ channelId: secret.id }),
    ).rejects.toBeInstanceOf(TRPCError);
    await expect(
      arjun.chat.send({ channelId: secret.id, body: "let me in" }),
    ).rejects.toBeInstanceOf(TRPCError);

    // Asking sends the admin a direct message.
    expect(
      await arjun.chat.requestAccess({ channelId: secret.id }),
    ).toMatchObject({ adminName: "Priya Raman" });

    const dm = (await owner.chat.sidebar()).channels.find(
      (entry) => entry.kind === "dm",
    )!;

    expect(dm.title).toBe("Arjun Mehta");
    expect(dm.unread).toBe(1);
  });

  it("counts unread messages and mentions until read", async () => {
    await arjun.chat.send({
      channelId: platform.id,
      body: `<@${ownerId}> can you look at ZEN-1?`,
    });

    const before = (await owner.chat.sidebar()).channels.find(
      (entry) => entry.id === platform.id,
    )!;

    expect(before.unread).toBe(2);
    expect(before.mentions).toBe(1);

    const mentions = await owner.chat.mentions({ unreadOnly: true });

    expect(mentions[0]).toMatchObject({
      channelName: "platform",
      names: { [ownerId]: "Priya Raman" },
    });

    await owner.chat.markRead({ channelId: platform.id });

    const after = (await owner.chat.sidebar()).channels.find(
      (entry) => entry.id === platform.id,
    )!;

    expect(after.unread).toBe(0);
    expect(await owner.chat.mentions({ unreadOnly: true })).toEqual([]);
  });

  it("threads replies and counts them on the first message", async () => {
    const first = await owner.chat.send({
      channelId: platform.id,
      body: "Redirect loop is back on staging",
    });

    await arjun.chat.send({
      channelId: platform.id,
      parentId: first.id,
      body: "Looking",
    });
    await meera.chat.send({
      channelId: platform.id,
      parentId: first.id,
      body: "Same here",
    });

    const thread = await owner.chat.thread({ messageId: first.id });

    expect(thread.replies.map((reply) => reply.body)).toEqual([
      "Looking",
      "Same here",
    ]);

    const page = await owner.chat.messages({ channelId: platform.id });
    const head = page.messages.find((message) => message.id === first.id)!;

    expect(head.replies).toMatchObject({ count: 2 });
    // Replies stay in the thread, not the channel.
    expect(page.messages.some((message) => message.body === "Looking")).toBe(
      false,
    );
  });

  it("toggles reactions and keeps queued sends from doubling", async () => {
    const message = await arjun.chat.send({
      channelId: platform.id,
      body: "Reverted",
      clientId: "queued-1",
    });
    const again = await arjun.chat.send({
      channelId: platform.id,
      body: "Reverted",
      clientId: "queued-1",
    });

    expect(again.id).toBe(message.id);

    await owner.chat.react({ messageId: message.id, emoji: "✅" });
    await meera.chat.react({ messageId: message.id, emoji: "✅" });

    let view = (
      await owner.chat.messages({ channelId: platform.id })
    ).messages.find((entry) => entry.id === message.id)!;

    expect(view.reactions).toMatchObject([
      { emoji: "✅", count: 2, mine: true },
    ]);

    await owner.chat.react({ messageId: message.id, emoji: "✅" });
    view = (
      await owner.chat.messages({ channelId: platform.id })
    ).messages.find((entry) => entry.id === message.id)!;
    expect(view.reactions).toMatchObject([{ count: 1, mine: false }]);
  });

  it("edits and deletes only your own messages", async () => {
    const message = await arjun.chat.send({
      channelId: platform.id,
      body: "typo",
    });

    await expect(
      meera.chat.edit({ messageId: message.id, body: "nope" }),
    ).rejects.toBeInstanceOf(TRPCError);
    await arjun.chat.edit({ messageId: message.id, body: "fixed" });
    await expect(
      meera.chat.remove({ messageId: message.id }),
    ).rejects.toBeInstanceOf(TRPCError);
    // The channel admin may clean up.
    await owner.chat.remove({ messageId: message.id });

    const view = (
      await owner.chat.messages({ channelId: platform.id })
    ).messages.find((entry) => entry.id === message.id)!;

    expect(view).toMatchObject({ deleted: true, body: "" });
  });

  it("finds messages by words, author and place", async () => {
    await arjun.chat.send({
      channelId: platform.id,
      body: "Okta posts back to the callback cross-site",
    });

    const all = await owner.chat.search({ q: "callback" });

    expect(all.results.map((entry) => entry.body)).toEqual([
      "Okta posts back to the callback cross-site",
    ]);
    expect(all.results[0]!.channel.name).toBe("platform");
    expect(
      (await owner.chat.search({ q: "callback", fromMemberId: meeraId })).total,
    ).toBe(0);
  });

  it("reuses a direct message between the same people", async () => {
    const first = await owner.chat.openDm({ memberIds: [meeraId] });
    const second = await meera.chat.openDm({ memberIds: [ownerId] });

    expect(second.id).toBe(first.id);
    await owner.chat.send({ channelId: first.id, body: "hey" });
    await expect(
      arjun.chat.messages({ channelId: first.id }),
    ).rejects.toBeInstanceOf(TRPCError);
  });

  it("pins, archives and keeps at least one admin", async () => {
    const message = await owner.chat.send({
      channelId: platform.id,
      body: "Release freeze starts Friday",
    });

    await arjun.chat.pin({ messageId: message.id, pinned: true });
    expect((await owner.chat.pins({ channelId: platform.id })).length).toBe(1);

    await expect(
      owner.chat.setRole({
        channelId: platform.id,
        memberId: ownerId,
        role: "member",
      }),
    ).rejects.toThrow(/at least one admin/);
    await expect(
      arjun.chat.archive({ channelId: platform.id, archived: true }),
    ).rejects.toBeInstanceOf(TRPCError);

    await owner.chat.archive({ channelId: platform.id, archived: true });
    await expect(
      arjun.chat.send({ channelId: platform.id, body: "still here?" }),
    ).rejects.toThrow(/archived/);
  });
});
