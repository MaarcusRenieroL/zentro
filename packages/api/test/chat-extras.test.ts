import { db } from "@zentro/db";
import { chatMessages, chatScheduled, files } from "@zentro/db/schema";
import { eq } from "@zentro/db/drizzle";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { runChatJobs } from "../src/server/chat-jobs";
import { World, type TestOrg } from "./helpers";

const world = new World();

afterAll(() => world.cleanup());

type Caller = Awaited<ReturnType<World["caller"]>>;
type Jobs = Parameters<typeof runChatJobs>[0];

describe("chat: saved, drafts, scheduling and reading", () => {
  let org: TestOrg;
  let owner: Caller;
  let arjun: Caller;
  let ownerId: string;
  let arjunId: string;
  let channel: { id: string };

  beforeAll(async () => {
    org = await world.org("Chat extras");
    const o = await world.userIn(org, "owner", "Priya Raman");
    const a = await world.userIn(org, "member", "Arjun Mehta");

    owner = await world.caller(o.user, org);
    arjun = await world.caller(a.user, org);
    ownerId = o.member.id;
    arjunId = a.member.id;
    channel = await owner.chat.create({ name: "extras", memberIds: [arjunId] });
  });

  it("saves a message and reminds about it when due", async () => {
    const message = await arjun.chat.send({
      channelId: channel.id,
      body: "Remember the launch checklist",
    });

    await owner.chat.saveMessage({ messageId: message.id, saved: true });
    await owner.chat.setReminder({
      messageId: message.id,
      remindAt: new Date(Date.now() + 3_600_000),
    });

    let saved = await owner.chat.savedList();

    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({ due: false });
    expect(saved[0]!.message.saved).not.toBeNull();

    // An hour on, it is due and shows in the sidebar count.
    await owner.chat.setReminder({
      messageId: message.id,
      remindAt: new Date(Date.now() - 1000),
    });
    saved = await owner.chat.savedList();
    expect(saved[0]).toMatchObject({ due: true });
    expect((await owner.chat.sidebar()).extras.dueReminders).toBe(1);

    await owner.chat.completeSaved({ messageId: message.id, done: true });
    expect((await owner.chat.sidebar()).extras.dueReminders).toBe(0);

    await owner.chat.saveMessage({ messageId: message.id, saved: false });
    expect(await owner.chat.savedList()).toEqual([]);
  });

  it("keeps a draft per composer and clears it when emptied", async () => {
    await owner.chat.draftSet({
      channelId: channel.id,
      scope: channel.id,
      body: "half a thought",
    });

    expect(await owner.chat.draftGet({ scope: channel.id })).toEqual({
      body: "half a thought",
    });
    expect(await owner.chat.draftList()).toMatchObject([
      { channelName: "extras", inThread: false },
    ]);
    // Another person's draft is separate.
    expect(await arjun.chat.draftGet({ scope: channel.id })).toEqual({
      body: "",
    });

    await owner.chat.draftSet({
      channelId: channel.id,
      scope: channel.id,
      body: "  ",
    });
    expect(await owner.chat.draftList()).toEqual([]);
  });

  it("sends a scheduled message at its time, once", async () => {
    const { id } = await owner.chat.schedule({
      channelId: channel.id,
      body: "Standup in 5",
      sendAt: new Date(Date.now() + 120_000),
    });

    expect(await owner.chat.scheduledList()).toHaveLength(1);
    await expect(
      owner.chat.schedule({
        channelId: channel.id,
        body: "too soon",
        sendAt: new Date(Date.now() + 1000),
      }),
    ).rejects.toThrow(/future/);

    // Bring it forward, then run the jobs twice.
    await db
      .update(chatScheduled)
      .set({ sendAt: new Date(Date.now() - 1000) })
      .where(eq(chatScheduled.id, id));

    const first = await runChatJobs(db as unknown as Jobs);
    const second = await runChatJobs(db as unknown as Jobs);

    expect(first.sent).toBe(1);
    expect(second.sent).toBe(0);

    const messages = await arjun.chat.messages({ channelId: channel.id });

    expect(
      messages.messages.filter((entry) => entry.body === "Standup in 5"),
    ).toHaveLength(1);
    expect(await owner.chat.scheduledList()).toEqual([]);
  });

  it("does not send a scheduled message after it was canceled", async () => {
    const { id } = await owner.chat.schedule({
      channelId: channel.id,
      body: "never sent",
      sendAt: new Date(Date.now() + 120_000),
    });

    await owner.chat.scheduledCancel({ id });
    await db
      .update(chatScheduled)
      .set({ sendAt: new Date(Date.now() - 1000) })
      .where(eq(chatScheduled.id, id));
    await runChatJobs(db as unknown as Jobs);

    const messages = await owner.chat.messages({ channelId: channel.id });

    expect(messages.messages.some((entry) => entry.body === "never sent")).toBe(
      false,
    );
  });

  it("marks a conversation unread from a message and shows read state", async () => {
    const message = await arjun.chat.send({
      channelId: channel.id,
      body: "read me",
    });

    await owner.chat.markRead({ channelId: channel.id });
    expect(
      (await owner.chat.sidebar()).channels.find((c) => c.id === channel.id)!
        .unread,
    ).toBe(0);

    await owner.chat.markUnread({
      channelId: channel.id,
      messageId: message.id,
    });
    expect(
      (await owner.chat.sidebar()).channels.find((c) => c.id === channel.id)!
        .unread,
    ).toBeGreaterThanOrEqual(1);

    const state = await arjun.chat.readState({ channelId: channel.id });

    expect(state.map((entry) => entry.name)).toEqual(["Priya Raman"]);
  });

  it("shows who is typing for a few seconds", async () => {
    await arjun.chat.typing({ channelId: channel.id });

    expect(await owner.chat.typingNow({ channelId: channel.id })).toEqual([
      "Arjun Mehta",
    ]);
    // You never see yourself typing.
    expect(await arjun.chat.typingNow({ channelId: channel.id })).toEqual([]);
  });

  it("follows threads you take part in, with unread counts", async () => {
    const parent = await owner.chat.send({
      channelId: channel.id,
      body: "Question for the thread",
    });

    await arjun.chat.send({
      channelId: channel.id,
      parentId: parent.id,
      body: "An answer",
    });

    let threads = await owner.chat.threads();
    let mine = threads.find((entry) => entry.message.id === parent.id)!;

    expect(mine.unread).toBe(1);

    await owner.chat.markThreadRead({ parentId: parent.id });
    threads = await owner.chat.threads();
    mine = threads.find((entry) => entry.message.id === parent.id)!;
    expect(mine.unread).toBe(0);

    await owner.chat.followThread({ parentId: parent.id, following: false });
    expect(
      (await owner.chat.threads()).some((e) => e.message.id === parent.id),
    ).toBe(false);
    expect(await owner.chat.threadFollowing({ parentId: parent.id })).toEqual({
      following: false,
    });
  });
});

describe("chat: polls, forwarding, status and channel extras", () => {
  let org: TestOrg;
  let owner: Caller;
  let arjun: Caller;
  let meera: Caller;
  let arjunId: string;
  let channel: { id: string };

  beforeAll(async () => {
    org = await world.org("Chat more");
    const o = await world.userIn(org, "owner", "Priya Raman");
    const a = await world.userIn(org, "member", "Arjun Mehta");
    const m = await world.userIn(org, "member", "Meera Iyer");

    owner = await world.caller(o.user, org);
    arjun = await world.caller(a.user, org);
    meera = await world.caller(m.user, org);
    arjunId = a.member.id;
    channel = await owner.chat.create({ name: "polls", memberIds: [arjunId] });
  });

  it("runs a single-choice poll: one vote each, changeable, closable", async () => {
    const { messageId } = await owner.chat.createPoll({
      channelId: channel.id,
      question: "Lunch?",
      options: ["Pizza", "Ramen", "Salad"],
    });
    const poll = (
      await owner.chat.messages({ channelId: channel.id })
    ).messages.find((entry) => entry.id === messageId)!.poll!;

    expect(poll).toMatchObject({ question: "Lunch?", total: 0, closed: false });

    await arjun.chat.votePoll({ pollId: poll.id, optionIndex: 0 });
    await arjun.chat.votePoll({ pollId: poll.id, optionIndex: 1 });
    await owner.chat.votePoll({ pollId: poll.id, optionIndex: 1 });

    const after = (
      await owner.chat.messages({ channelId: channel.id })
    ).messages.find((entry) => entry.id === messageId)!.poll!;

    expect(after.options.map((o) => o.votes)).toEqual([0, 2, 0]);
    expect(after.options[1]!.mine).toBe(true);
    expect(after.total).toBe(2);

    await expect(arjun.chat.closePoll({ pollId: poll.id })).rejects.toThrow(
      /author/,
    );
    await owner.chat.closePoll({ pollId: poll.id });
    await expect(
      arjun.chat.votePoll({ pollId: poll.id, optionIndex: 2 }),
    ).rejects.toThrow(/closed/);
  });

  it("forwards a message, and hides the origin from people who cannot read it", async () => {
    const secret = await owner.chat.create({
      name: "inner-circle",
      visibility: "private",
      memberIds: [arjunId],
    });
    const original = await owner.chat.send({
      channelId: secret.id,
      body: "Quarterly numbers look strong",
    });

    // Arjun forwards it to the public channel; Meera is not in the secret one.
    await arjun.chat.forward({
      messageId: original.id,
      channelId: channel.id,
      note: "FYI",
    });

    const forReader = (
      await arjun.chat.messages({ channelId: channel.id })
    ).messages.find((entry) => entry.body === "FYI")!;
    const forOutsider = (
      await meera.chat.messages({ channelId: channel.id })
    ).messages.find((entry) => entry.body === "FYI")!;

    expect(forReader.forwarded).toMatchObject({
      channelName: "inner-circle",
      authorName: "Priya Raman",
    });
    expect(forOutsider.forwarded).toBeNull();

    // Meera cannot forward what she cannot read.
    await expect(
      meera.chat.forward({ messageId: original.id, channelId: channel.id }),
    ).rejects.toThrow();
  });

  it("sets a status, and do not disturb silences the badge", async () => {
    await arjun.chat.statusSet({
      emoji: "🌴",
      text: "On leave",
      clearInMinutes: 60,
      dndMinutes: 30,
    });

    expect(await arjun.chat.statusGet()).toMatchObject({
      emoji: "🌴",
      text: "On leave",
    });

    const message = await arjun.chat.send({
      channelId: channel.id,
      body: "status check",
    });

    expect(message.author?.status).toMatchObject({ text: "On leave" });

    await owner.chat.send({
      channelId: channel.id,
      body: `<@${arjunId}> ping`,
    });
    expect((await arjun.chat.sidebar()).totalUnread).toBe(0);

    await arjun.chat.statusSet({
      emoji: null,
      text: null,
      clearInMinutes: null,
      dndMinutes: 0,
    });
    expect((await arjun.chat.sidebar()).totalUnread).toBeGreaterThan(0);
  });

  it("keeps bookmarks, a canvas note and retention for members and admins", async () => {
    await arjun.chat.addBookmark({
      channelId: channel.id,
      title: "Runbook",
      url: "https://example.com/runbook",
    });
    await expect(
      owner.chat.addBookmark({
        channelId: channel.id,
        title: "Bad",
        url: "javascript:alert(1)",
      }),
    ).rejects.toThrow();
    expect(await meera.chat.bookmarks({ channelId: channel.id })).toMatchObject(
      [{ title: "Runbook" }],
    );

    await arjun.chat.setCanvas({ channelId: channel.id, canvas: "Rules here" });
    expect(
      (await meera.chat.get({ name: "polls" })) as { canvas?: string },
    ).toMatchObject({
      canvas: "Rules here",
    });

    // Only admins set retention.
    await expect(
      arjun.chat.setRetention({ channelId: channel.id, days: 30 }),
    ).rejects.toThrow(/admins/);
    await owner.chat.setRetention({ channelId: channel.id, days: 30 });
    await expect(
      arjun.chat.exportChannel({ channelId: channel.id }),
    ).rejects.toThrow(/admins/);

    const exported = await owner.chat.exportChannel({ channelId: channel.id });

    expect(exported.channel).toBe("polls");
    expect(exported.messages.length).toBeGreaterThan(0);
  });

  it("purges messages past retention but keeps pinned ones", async () => {
    const old = await owner.chat.send({
      channelId: channel.id,
      body: "ancient",
    });
    const keep = await owner.chat.send({
      channelId: channel.id,
      body: "pinned old",
    });

    await owner.chat.pin({ messageId: keep.id, pinned: true });
    await db
      .update(chatMessages)
      .set({ createdAt: new Date(Date.now() - 90 * 86_400_000) })
      .where(eq(chatMessages.id, old.id));
    await db
      .update(chatMessages)
      .set({ createdAt: new Date(Date.now() - 90 * 86_400_000) })
      .where(eq(chatMessages.id, keep.id));

    const result = await runChatJobs(db as unknown as Jobs, { heavy: true });

    expect(result.purged).toBeGreaterThanOrEqual(1);

    const bodies = (
      await owner.chat.messages({ channelId: channel.id })
    ).messages.map((entry) => entry.body);

    expect(bodies).not.toContain("ancient");
    expect(bodies).toContain("pinned old");
  });

  it("summarizes without a model by describing what is there", async () => {
    const { summary, ai } = await owner.chat.summarize({
      channelId: channel.id,
    });

    expect(ai).toBe(false);
    expect(summary).toMatch(/messages from/);
    await expect(
      owner.chat.translate({
        messageId: (await owner.chat.messages({ channelId: channel.id }))
          .messages[0]!.id,
        language: "French",
      }),
    ).rejects.toThrow(/ANTHROPIC_API_KEY/);
  });
});

describe("chat: custom emoji", () => {
  let org: TestOrg;
  let owner: Caller;
  let member: Caller;
  let ownerId: string;

  beforeAll(async () => {
    org = await world.org("Emoji org");
    const o = await world.userIn(org, "owner", "Priya Raman");
    const m = await world.userIn(org, "member", "Arjun Mehta");

    owner = await world.caller(o.user, org);
    member = await world.caller(m.user, org);
    ownerId = o.member.id;
  });

  const upload = async (mimeType: string, size: number) => {
    const [row] = await db
      .insert(files)
      .values({
        organizationId: org.id,
        uploadedByMemberId: ownerId,
        name: "party.png",
        mimeType,
        size,
        storageKey: `test/${Math.random()}`,
      })
      .returning({ id: files.id });

    return row!.id;
  };

  it("adds an emoji from a small image, and refuses anything else", async () => {
    await owner.chat.emojiCreate({
      name: "Party-Parrot",
      fileId: await upload("image/png", 4000),
    });
    expect(await member.chat.emojiList()).toMatchObject([
      { name: "party-parrot" },
    ]);

    await expect(
      owner.chat.emojiCreate({
        name: "doc",
        fileId: await upload("application/pdf", 4000),
      }),
    ).rejects.toThrow(/image/);
    await expect(
      owner.chat.emojiCreate({
        name: "huge",
        fileId: await upload("image/png", 900_000),
      }),
    ).rejects.toThrow(/256 KB/);
    await expect(
      owner.chat.emojiCreate({
        name: "party-parrot",
        fileId: await upload("image/png", 4000),
      }),
    ).rejects.toThrow(/taken/);
    await expect(
      owner.chat.emojiCreate({
        name: "x",
        fileId: await upload("image/png", 4000),
      }),
    ).rejects.toThrow();
  });

  it("lets everyone in the organization open an emoji image, and only admins delete it", async () => {
    const emoji = (await member.chat.emojiList())[0]!;
    const id = emoji.url.split("/").pop()!;

    // Someone who did not upload it can still load it.
    expect(await member.files.get({ id })).toMatchObject({ name: "party.png" });

    await expect(
      member.chat.emojiDelete({ name: "party-parrot" }),
    ).rejects.toThrow();
    await owner.chat.emojiDelete({ name: "party-parrot" });
    expect(await member.chat.emojiList()).toEqual([]);
  });
});
