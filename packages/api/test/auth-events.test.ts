import { randomUUID } from "node:crypto";

import { auth } from "@zentro/auth";
import { db } from "@zentro/db";
import { and, asc, eq, like } from "@zentro/db/drizzle";
import {
  activityEvents,
  members,
  users,
  verifications,
} from "@zentro/db/schema";
import { afterAll, describe, expect, it } from "vitest";

import { World, type TestOrg } from "./helpers";

const world = new World();

afterAll(() => world.cleanup());

const password = "A-long-enough-password-1";
const baseUrl = "http://localhost:3000/api/auth";

function clientHeaders(extra: Record<string, string> = {}) {
  return new Headers({
    "content-type": "application/json",
    origin: "http://localhost:3000",
    "x-forwarded-for": "198.51.100.23, 10.1.1.1",
    "user-agent": "AuthTest/2.0",
    ...extra,
  });
}

async function call(
  path: string,
  body: unknown,
  headers = clientHeaders(),
  method = "POST",
) {
  return auth.handler(
    new Request(`${baseUrl}${path}`, {
      method,
      headers,
      body: method === "POST" ? JSON.stringify(body) : undefined,
    }),
  );
}

function cookieOf(response: Response) {
  return response.headers
    .getSetCookie()
    .map((cookie) => cookie.split(";")[0])
    .join("; ");
}

async function eventsOf(org: TestOrg, prefix: string) {
  return db
    .select()
    .from(activityEvents)
    .where(
      and(
        eq(activityEvents.organizationId, org.id),
        like(activityEvents.action, `${prefix}%`),
      ),
    )
    .orderBy(asc(activityEvents.createdAt));
}

/** A real account, created through sign-up, that belongs to `org`. */
async function account(org: TestOrg) {
  const email = `auth-${randomUUID().slice(0, 8)}@example.test`;
  const response = await call("/sign-up/email", {
    email,
    password,
    name: "Auth Person",
  });

  expect(response.status).toBe(200);

  const [user] = await db.select().from(users).where(eq(users.email, email));

  world.trackUser(user!.id);
  await db
    .insert(members)
    .values({ organizationId: org.id, userId: user!.id, role: "member" });

  return { email, id: user!.id };
}

describe("authentication events", () => {
  it("records sign-up only for people who already belong to an organization", async () => {
    const org = await world.org("Signup");
    const email = `fresh-${randomUUID().slice(0, 8)}@example.test`;

    await call("/sign-up/email", { email, password, name: "New" });

    const [user] = await db.select().from(users).where(eq(users.email, email));

    world.trackUser(user!.id);
    // A brand new account is in no organization, so there is nowhere to write.
    expect(
      await db
        .select()
        .from(activityEvents)
        .where(eq(activityEvents.actorUserId, user!.id)),
    ).toHaveLength(0);
    expect(await eventsOf(org, "auth.")).toHaveLength(0);
  });

  it("records sign-in, failed sign-in and sign-out with request details", async () => {
    const org = await world.org("Signin");
    const { email, id } = await account(org);

    const wrong = await call("/sign-in/email", {
      email,
      password: "definitely-wrong-password",
    });

    expect(wrong.status).toBeGreaterThanOrEqual(400);

    const ok = await call("/sign-in/email", { email, password });

    expect(ok.status).toBe(200);

    const [failedEvent] = await eventsOf(org, "auth.sign_in_failed");
    const [signIn] = await eventsOf(org, "auth.sign_in");

    expect(failedEvent).toMatchObject({
      actorUserId: id,
      auditOnly: true,
      targetType: "session",
    });
    expect(signIn).toMatchObject({
      actorUserId: id,
      auditOnly: true,
      ip: "198.51.100.23",
      userAgent: "AuthTest/2.0",
    });
    expect(signIn!.requestId).toBeTruthy();
    // The password that was typed is stored nowhere.
    expect(JSON.stringify(await eventsOf(org, "auth."))).not.toContain(
      "definitely-wrong",
    );

    const out = await call(
      "/sign-out",
      {},
      clientHeaders({ cookie: cookieOf(ok) }),
    );

    expect(out.status).toBe(200);
    expect(await eventsOf(org, "auth.sign_out")).toHaveLength(1);
  });

  it("ignores failed sign-ins for accounts that do not exist", async () => {
    const org = await world.org("Unknown account");

    await account(org);
    await call("/sign-in/email", { email: "nobody@example.test", password });
    expect(await eventsOf(org, "auth.sign_in_failed")).toHaveLength(0);
  });

  it("records password change, reset request and reset without storing tokens", async () => {
    const org = await world.org("Passwords");
    const { email, id } = await account(org);
    const signedIn = await call("/sign-in/email", { email, password });
    const cookie = cookieOf(signedIn);
    const next = "Another-long-password-2";

    const changed = await call(
      "/change-password",
      { currentPassword: password, newPassword: next },
      clientHeaders({ cookie }),
    );

    expect(changed.status).toBe(200);
    expect(await eventsOf(org, "auth.password_changed")).toHaveLength(1);

    await call("/request-password-reset", {
      email,
      redirectTo: "/auth/reset-password",
    });
    expect(await eventsOf(org, "auth.password_reset_requested")).toHaveLength(
      1,
    );

    const [pending] = await db
      .select()
      .from(verifications)
      .where(eq(verifications.value, id));
    const token = pending!.identifier.slice("reset-password:".length);

    const reset = await call("/reset-password", {
      newPassword: "Third-long-password-3",
      token,
    });

    expect(reset.status).toBe(200);

    const completed = await eventsOf(org, "auth.password_reset_completed");

    expect(completed).toHaveLength(1);
    expect(completed[0]!.actorUserId).toBe(id);
    expect(JSON.stringify(await eventsOf(org, "auth."))).not.toContain(token);
    expect(JSON.stringify(await eventsOf(org, "auth."))).not.toContain(
      "Another-long",
    );
  });

  it("records email verification", async () => {
    const org = await world.org("Verify");
    const { email } = await account(org);

    await call("/email-otp/send-verification-otp", {
      email,
      type: "email-verification",
    });

    const [row] = await db
      .select()
      .from(verifications)
      .where(eq(verifications.identifier, `email-verification-otp-${email}`));
    const otp = row!.value.split(":")[0]!;
    const verified = await call("/email-otp/verify-email", { email, otp });

    expect(verified.status).toBe(200);
    expect(await eventsOf(org, "auth.email_verified")).toHaveLength(1);
    expect(JSON.stringify(await eventsOf(org, "auth."))).not.toContain(otp);
  });
});

describe("membership events from Better Auth", () => {
  it("records an accepted invitation and the member joining", async () => {
    const org = await world.org("Accept");
    const owner = await world.userIn(org, "owner");
    const { email, id } = await (async () => {
      const mail = `inv-${randomUUID().slice(0, 8)}@example.test`;
      await call("/sign-up/email", {
        email: mail,
        password,
        name: "Invitee Person",
      });
      const [user] = await db.select().from(users).where(eq(users.email, mail));

      world.trackUser(user!.id);
      await db
        .update(users)
        .set({ emailVerified: true })
        .where(eq(users.id, user!.id));

      return { email: mail, id: user!.id };
    })();
    const invitation = await world.invitation(org, owner.user, {
      email,
      role: "member",
    });
    const signedIn = await call("/sign-in/email", { email, password });
    const accepted = await call(
      "/organization/accept-invitation",
      { invitationId: invitation.id },
      clientHeaders({ cookie: cookieOf(signedIn) }),
    );

    expect(accepted.status).toBe(200);
    expect((await eventsOf(org, "invitation.accepted"))[0]).toMatchObject({
      actorUserId: id,
      targetId: invitation.id,
      targetLabel: email,
      auditOnly: true,
    });
    expect((await eventsOf(org, "member.joined"))[0]).toMatchObject({
      actorUserId: id,
      targetLabel: "Invitee Person",
      auditOnly: false,
    });
  });

  it("records a rejected invitation", async () => {
    const org = await world.org("Reject");
    const owner = await world.userIn(org, "owner");
    const mail = `rej-${randomUUID().slice(0, 8)}@example.test`;

    await call("/sign-up/email", { email: mail, password, name: "Rejecter" });

    const [user] = await db.select().from(users).where(eq(users.email, mail));

    world.trackUser(user!.id);
    await db
      .update(users)
      .set({ emailVerified: true })
      .where(eq(users.id, user!.id));

    const invitation = await world.invitation(org, owner.user, { email: mail });
    const signedIn = await call("/sign-in/email", { email: mail, password });

    await call(
      "/organization/reject-invitation",
      { invitationId: invitation.id },
      clientHeaders({ cookie: cookieOf(signedIn) }),
    );
    expect((await eventsOf(org, "invitation.rejected"))[0]).toMatchObject({
      targetId: invitation.id,
    });
  });

  it("records leaving an organization and creating one", async () => {
    const org = await world.org("Leave");

    await world.userIn(org, "owner");

    const { email, id } = await account(org);
    const signedIn = await call("/sign-in/email", { email, password });
    const cookie = cookieOf(signedIn);

    const left = await call(
      "/organization/leave",
      { organizationId: org.id },
      clientHeaders({ cookie }),
    );

    expect(left.status).toBe(200);
    expect((await eventsOf(org, "member.left"))[0]).toMatchObject({
      actorUserId: id,
      targetLabel: "Auth Person",
    });

    const created = await call(
      "/organization/create",
      { name: "Created via hook", slug: `hook-${randomUUID().slice(0, 8)}` },
      clientHeaders({ cookie }),
    );
    const body = (await created.json()) as { id: string };

    world.trackOrg(body.id);
    expect(created.status).toBe(200);
    expect(
      (
        await db
          .select()
          .from(activityEvents)
          .where(eq(activityEvents.organizationId, body.id))
      ).map((event) => event.action),
    ).toContain("org.created");
  });
});
