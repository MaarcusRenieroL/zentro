import { TRPCError } from "@trpc/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { World, type TestOrg } from "./helpers";

const world = new World();

afterAll(() => world.cleanup());

type Caller = Awaited<ReturnType<World["caller"]>>;

describe("files shared in chat", () => {
  let org: TestOrg;
  let owner: Caller;
  let member: Caller;
  let outsider: Caller;
  let channel: { id: string };
  let privateChannel: { id: string };

  const upload = (caller: Caller, name = "plan.pdf") =>
    caller.files.register({
      name,
      mimeType: "application/pdf",
      size: 2048,
      storageKey: `${org.id}/${Math.random().toString(36).slice(2)}.pdf`,
    });

  beforeAll(async () => {
    org = await world.org("Filing");
    const o = await world.userIn(org, "owner", "Olive Owner");
    const m = await world.userIn(org, "member", "Max Member");
    const x = await world.userIn(org, "member", "Out Sider");

    owner = await world.caller(o.user, org);
    member = await world.caller(m.user, org);
    outsider = await world.caller(x.user, org);
    channel = await owner.chat.create({ name: "files-open" });
    privateChannel = await owner.chat.create({
      name: "files-closed",
      visibility: "private",
    });
  });

  it("refuses oversized files and keys outside the organization", async () => {
    await expect(
      owner.files.authorizeUpload({ size: 26 * 1024 * 1024 }),
    ).rejects.toBeInstanceOf(TRPCError);
    await expect(
      owner.files.register({
        name: "x.pdf",
        mimeType: "application/pdf",
        size: 10,
        storageKey: "someone-else/x.pdf",
      }),
    ).rejects.toThrow(/Bad file key/);
  });

  it("attaches a file to a message, once, and only your own upload", async () => {
    const file = await upload(owner);
    const message = await owner.chat.send({
      channelId: channel.id,
      body: "Research",
      fileIds: [file.id],
    });

    expect(message.attachments).toMatchObject([
      { id: file.id, name: "plan.pdf", url: `/api/files/${file.id}` },
    ]);

    // Someone else's upload, or one already attached, is ignored.
    const theirs = await upload(member, "theirs.pdf");
    const second = await owner.chat.send({
      channelId: channel.id,
      body: "Again",
      fileIds: [file.id, theirs.id],
    });

    expect(second.attachments).toEqual([]);
  });

  it("opens a file for people who can read its conversation only", async () => {
    const open = await upload(owner, "open.pdf");
    const closed = await upload(owner, "closed.pdf");

    await owner.chat.send({
      channelId: channel.id,
      body: "public",
      fileIds: [open.id],
    });
    await owner.chat.send({
      channelId: privateChannel.id,
      body: "private",
      fileIds: [closed.id],
    });

    expect(await member.files.get({ id: open.id })).toMatchObject({
      name: "open.pdf",
      sharedIn: { name: "files-open" },
      uploadedBy: "Olive Owner",
    });
    await expect(outsider.files.get({ id: closed.id })).rejects.toBeInstanceOf(
      TRPCError,
    );
    expect(
      (await member.files.list({ channelId: channel.id })).map(
        (file) => file.name,
      ),
    ).toContain("open.pdf");
    expect(await outsider.files.list({ channelId: privateChannel.id })).toEqual(
      [],
    );
  });
});
