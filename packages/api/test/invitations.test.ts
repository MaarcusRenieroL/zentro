import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { World, type TestOrg, type TestUser } from "./helpers";

const world = new World();

let org: TestOrg;
let inviter: TestUser;
let invitee: TestUser;
let stranger: TestUser;
let invitationId: string;

beforeAll(async () => {
  org = await world.org("Inviting Org");
  inviter = (await world.userIn(org, "owner", "Inviter")).user;
  // New users: no organization and no active organization.
  invitee = await world.user("Invitee");
  stranger = await world.user("Stranger");

  // Stored with different casing than the user's address.
  const invitation = await world.invitation(org, inviter, {
    email: invitee.email.toUpperCase(),
  });

  invitationId = invitation.id;
});

afterAll(() => world.cleanup());

describe("organization.getInviteDetails", () => {
  it("lets a new user without an organization read their own invitation", async () => {
    const details = await world
      .sessionCaller(invitee)
      .organization.getInviteDetails({ invitationId });

    expect(details).toMatchObject({
      invitationId,
      organizationId: org.id,
      organizationName: "Inviting Org",
      inviterName: "Inviter",
      role: "member",
      membersCount: 1,
    });
  });

  it("compares the email case-insensitively", async () => {
    // The stored address is upper-case; the user's is lower-case.
    expect(invitee.email).toBe(invitee.email.toLowerCase());
    await expect(
      world.sessionCaller(invitee).organization.getInviteDetails({
        invitationId,
      }),
    ).resolves.toBeDefined();
  });

  it("returns NOT_FOUND to a different signed-in user", async () => {
    await expect(
      world.sessionCaller(stranger).organization.getInviteDetails({
        invitationId,
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("answers an unknown id exactly like another user's invitation", async () => {
    const unknown = world
      .sessionCaller(stranger)
      .organization.getInviteDetails({
        invitationId: "00000000-0000-4000-8000-000000000000",
      });

    await expect(unknown).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Invitation not found.",
    });
  });

  it("requires a session", async () => {
    await expect(
      world.anonymousCaller().organization.getInviteDetails({ invitationId }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("still reports an expired invitation to its own recipient only", async () => {
    const expired = await world.invitation(org, inviter, {
      email: invitee.email,
      expiresAt: new Date(Date.now() - 1000),
    });

    await expect(
      world.sessionCaller(invitee).organization.getInviteDetails({
        invitationId: expired.id,
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      world.sessionCaller(stranger).organization.getInviteDetails({
        invitationId: expired.id,
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
