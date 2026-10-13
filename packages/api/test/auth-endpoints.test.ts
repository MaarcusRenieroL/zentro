import { auth, disabledOrganizationPaths } from "@zentro/auth";
import { db } from "@zentro/db";
import { and, eq } from "@zentro/db/drizzle";
import {
  invitations,
  members,
  organizations,
  permissionOverrides,
  roleAssignments,
  sessions,
  teamMembers,
  users,
} from "@zentro/db/schema";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { World, type TestOrg, type TestUser } from "./helpers";

// Every endpoint Better Auth registers is either unreachable over HTTP or
// listed here with the reason it is safe to leave open. A Better Auth upgrade
// that adds an endpoint fails the first test until it is classified.

const world = new World();

afterAll(() => world.cleanup());

type Endpoint = { path?: string; options?: { method?: string | string[] } };

const registered = Object.entries(auth.api as Record<string, Endpoint>).map(
  ([name, endpoint]) => ({ name, path: endpoint.path }),
);

// Reachable over HTTP on purpose. Each acts on the caller's own session, user
// or invitations, and checks membership or the invited address itself.
const openOrganizationEndpoints: Record<string, string> = {
  "/organization/create":
    "Anyone verified may start their own organization and becomes its owner; nothing existing is touched.",
  "/organization/check-slug": "Reports whether a slug is free.",
  "/organization/list": "Lists only the caller's own organizations.",
  "/organization/set-active":
    "Better Auth requires the caller to be a member of the organization.",
  "/organization/accept-invitation":
    "Better Auth requires the invitation to be addressed to the caller's email.",
  "/organization/reject-invitation":
    "Better Auth requires the invitation to be addressed to the caller's email.",
  "/organization/leave":
    "Removes only the caller; the last owner cannot leave, and the access that came with the membership is cleared by an after-hook.",
};

const organizationRoutes = registered.filter((endpoint) =>
  endpoint.path?.startsWith("/organization/"),
);

const baseUrl = "http://localhost:3000/api/auth";

async function call(
  headers: Headers,
  method: "GET" | "POST",
  path: string,
  body?: unknown,
) {
  const requestHeaders = new Headers(headers);

  requestHeaders.set("content-type", "application/json");

  return auth.handler(
    new Request(`${baseUrl}${path}`, {
      method,
      headers: requestHeaders,
      body: method === "POST" ? JSON.stringify(body ?? {}) : undefined,
    }),
  );
}

describe("every organization endpoint is classified", () => {
  it("is disabled over HTTP or explicitly allowed", () => {
    for (const { name, path } of organizationRoutes) {
      const classified =
        disabledOrganizationPaths.includes(path!) ||
        path! in openOrganizationEndpoints;

      expect(classified, `${name} (${path}) is not classified`).toBe(true);
    }
  });

  it("keeps the allow list free of endpoints that no longer exist", () => {
    const paths = new Set(organizationRoutes.map((route) => route.path));

    for (const path of Object.keys(openOrganizationEndpoints)) {
      expect(paths.has(path), path).toBe(true);
    }
  });

  it("has no HTTP route for addMember or the other server-only calls", async () => {
    const serverOnly = registered
      .filter((endpoint) => endpoint.path === undefined)
      .map((endpoint) => endpoint.name)
      .sort();

    expect(serverOnly).toContain("addMember");

    const org = await world.org("Server only");
    const { user } = await world.userIn(org, "member");
    const other = await world.user("Not a member");
    const headers = await world.sessionHeaders(user, org);
    const response = await call(headers, "POST", "/organization/add-member", {
      userId: other.id,
      role: "owner",
      organizationId: org.id,
    });

    expect(response.status).toBe(404);
    expect(
      await db.select().from(members).where(eq(members.userId, other.id)),
    ).toHaveLength(0);
  });

  it("answers 404 for has-permission, whose answers ignore our permissions", async () => {
    const org = await world.org("Has permission");
    const { user } = await world.userIn(org, "member");
    const response = await call(
      await world.sessionHeaders(user, org),
      "POST",
      "/organization/has-permission",
      { permissions: { organization: ["delete"] } },
    );

    expect(response.status).toBe(404);
  });
});

describe("set-active, create and list", () => {
  let org: TestOrg;
  let foreign: TestOrg;
  let user: TestUser;
  let outsider: TestUser;

  beforeAll(async () => {
    org = await world.org("Mine");
    foreign = await world.org("Not mine");
    user = (await world.userIn(org, "member")).user;
    outsider = (await world.userIn(foreign, "owner")).user;
  });

  it("refuses to activate an organization the user does not belong to", async () => {
    const headers = await world.sessionHeaders(user, org);
    const response = await call(headers, "POST", "/organization/set-active", {
      organizationId: foreign.id,
    });

    expect(response.status).toBeGreaterThanOrEqual(400);

    // Better Auth also drops the active organization, so the session ends
    // up with none and never with the foreign one.
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.userId, user.id));

    expect(session?.activeOrganizationId).not.toBe(foreign.id);
  });

  it("activates one the user belongs to", async () => {
    const headers = await world.sessionHeaders(user);
    const response = await call(headers, "POST", "/organization/set-active", {
      organizationId: org.id,
    });

    expect(response.status).toBe(200);
  });

  it("does not let update-session point the session at another organization", async () => {
    const headers = await world.sessionHeaders(user, org);
    const response = await call(headers, "POST", "/update-session", {
      activeOrganizationId: foreign.id,
    });

    expect(response.status).toBe(404);

    const rows = await db
      .select()
      .from(sessions)
      .where(eq(sessions.userId, user.id));

    expect(rows.every((row) => row.activeOrganizationId !== foreign.id)).toBe(
      true,
    );
  });

  it("lists only the caller's own organizations", async () => {
    const response = await call(
      await world.sessionHeaders(user, org),
      "GET",
      "/organization/list",
    );
    const body = (await response.json()) as Array<{ id: string }>;

    expect(body.map((item) => item.id)).toEqual([org.id]);
    expect(outsider.id).not.toBe(user.id);
  });

  it("creates an organization owned by the caller, ignoring a forged userId", async () => {
    const victim = await world.user("Victim");
    const headers = await world.sessionHeaders(user);
    const response = await call(headers, "POST", "/organization/create", {
      name: "Fresh start",
      slug: `fresh-${Math.random().toString(36).slice(2, 10)}`,
      userId: victim.id,
    });

    expect(response.status).toBe(200);

    const created = (await response.json()) as { id: string };

    world.trackOrg(created.id);

    const rows = await db
      .select()
      .from(members)
      .where(eq(members.organizationId, created.id));

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ userId: user.id, role: "owner" });
  });

  it("cannot create an organization on a slug that is taken", async () => {
    const response = await call(
      await world.sessionHeaders(user),
      "POST",
      "/organization/create",
      { name: "Takeover", slug: org.slug },
    );

    expect(response.status).toBeGreaterThanOrEqual(400);

    const rows = await db
      .select()
      .from(members)
      .where(eq(members.organizationId, org.id));

    expect(rows.filter((row) => row.role === "owner")).toHaveLength(0);
  });
});

describe("invitations addressed to someone else", () => {
  it("cannot be accepted or rejected by another user", async () => {
    const org = await world.org("Invites");
    const owner = await world.userIn(org, "owner");
    const invited = await world.user("Invited");
    const thief = await world.user("Thief");
    const invitation = await world.invitation(org, owner.user, {
      email: invited.email,
      role: "admin",
    });

    const accepted = await call(
      await world.sessionHeaders(thief),
      "POST",
      "/organization/accept-invitation",
      { invitationId: invitation.id },
    );
    const rejected = await call(
      await world.sessionHeaders(thief),
      "POST",
      "/organization/reject-invitation",
      { invitationId: invitation.id },
    );

    expect(accepted.status).toBeGreaterThanOrEqual(400);
    expect(rejected.status).toBeGreaterThanOrEqual(400);
    expect(
      await db.select().from(members).where(eq(members.userId, thief.id)),
    ).toHaveLength(0);

    const [row] = await db
      .select()
      .from(invitations)
      .where(eq(invitations.id, invitation.id));

    expect(row?.status).toBe("pending");
  });

  it("can be accepted by the invited user, with exactly the invited role", async () => {
    const org = await world.org("Invites ok");
    const owner = await world.userIn(org, "owner");
    const invited = await world.user("Invited");
    const invitation = await world.invitation(org, owner.user, {
      email: invited.email,
      role: "member",
    });

    const response = await call(
      await world.sessionHeaders(invited),
      "POST",
      "/organization/accept-invitation",
      { invitationId: invitation.id },
    );

    expect(response.status).toBe(200);

    const [member] = await db
      .select()
      .from(members)
      .where(
        and(eq(members.userId, invited.id), eq(members.organizationId, org.id)),
      );

    expect(member?.role).toBe("member");
  });

  it("is not accepted twice, nor after it was rejected", async () => {
    const org = await world.org("Invites once");
    const owner = await world.userIn(org, "owner");
    const invited = await world.user("Invited");
    const invitation = await world.invitation(org, owner.user, {
      email: invited.email,
    });
    const headers = await world.sessionHeaders(invited);

    expect(
      (
        await call(headers, "POST", "/organization/reject-invitation", {
          invitationId: invitation.id,
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await call(headers, "POST", "/organization/accept-invitation", {
          invitationId: invitation.id,
        })
      ).status,
    ).toBeGreaterThanOrEqual(400);
    expect(
      await db.select().from(members).where(eq(members.userId, invited.id)),
    ).toHaveLength(0);
  });

  it("an unverified address cannot accept", async () => {
    const org = await world.org("Invites unverified");
    const owner = await world.userIn(org, "owner");
    const invited = await world.user("Unverified");

    await db
      .update(users)
      .set({ emailVerified: false })
      .where(eq(users.id, invited.id));

    const invitation = await world.invitation(org, owner.user, {
      email: invited.email,
    });
    const response = await call(
      await world.sessionHeaders(invited),
      "POST",
      "/organization/accept-invitation",
      { invitationId: invitation.id },
    );

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(
      await db.select().from(members).where(eq(members.userId, invited.id)),
    ).toHaveLength(0);
  });
});

describe("leaving an organization", () => {
  it("is refused for the last owner", async () => {
    const org = await world.org("Last owner");
    const owner = await world.userIn(org, "owner");
    const response = await call(
      await world.sessionHeaders(owner.user, org),
      "POST",
      "/organization/leave",
      { organizationId: org.id },
    );

    expect(response.status).toBe(400);
    expect(
      await db.select().from(members).where(eq(members.organizationId, org.id)),
    ).toHaveLength(1);
    expect(
      await db.select().from(organizations).where(eq(organizations.id, org.id)),
    ).toHaveLength(1);
  });

  it("is allowed for a second owner", async () => {
    const org = await world.org("Two owners");

    await world.userIn(org, "owner");

    const second = await world.userIn(org, "owner");
    const response = await call(
      await world.sessionHeaders(second.user, org),
      "POST",
      "/organization/leave",
      { organizationId: org.id },
    );

    expect(response.status).toBe(200);
  });

  it("an organization the user is not in cannot be left", async () => {
    const org = await world.org("Not a member");
    const stranger = await world.user("Stranger");
    const response = await call(
      await world.sessionHeaders(stranger),
      "POST",
      "/organization/leave",
      { organizationId: org.id },
    );

    expect(response.status).toBeGreaterThanOrEqual(400);
  });

  it("clears the roles, overrides, team memberships and sessions that came with the membership", async () => {
    const org = await world.org("Leaving");
    await world.userIn(org, "owner");
    const leaver = await world.userIn(org, "member");
    const project = await world.project(org);
    const team = await world.team(org);

    await db.insert(teamMembers).values({
      organizationId: org.id,
      teamId: team.id,
      memberId: leaver.member.id,
    });
    await world.assign(
      org,
      await world.systemRoleId(org, "project_lead"),
      { type: "user", id: leaver.user.id },
      { type: "project", id: project.id },
    );
    await world.override(org, leaver.user, "tasks.view", "allow");

    const headers = await world.sessionHeaders(leaver.user, org);
    const response = await call(headers, "POST", "/organization/leave", {
      organizationId: org.id,
    });

    expect(response.status).toBe(200);
    expect(
      await db
        .select()
        .from(roleAssignments)
        .where(eq(roleAssignments.principalId, leaver.user.id)),
    ).toHaveLength(0);
    expect(
      await db
        .select()
        .from(permissionOverrides)
        .where(eq(permissionOverrides.userId, leaver.user.id)),
    ).toHaveLength(0);
    expect(
      await db
        .select()
        .from(teamMembers)
        .where(eq(teamMembers.memberId, leaver.member.id)),
    ).toHaveLength(0);

    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.userId, leaver.user.id));

    expect(session?.activeOrganizationId).toBeNull();

    // Nothing is left to reach the organization through.
    const stale = await world.caller(leaver.user, org);

    await expect(stale.project.getProjectsByOrgId()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});

describe("core endpoints cannot change roles or memberships", () => {
  it("update-user ignores a role and other protected fields", async () => {
    const org = await world.org("Update user");
    const member = await world.userIn(org, "member");
    const headers = await world.sessionHeaders(member.user, org);

    await call(headers, "POST", "/update-user", {
      name: "Renamed",
      role: "owner",
      emailVerified: false,
    });

    const [row] = await db
      .select()
      .from(users)
      .where(eq(users.id, member.user.id));
    const [membership] = await db
      .select()
      .from(members)
      .where(eq(members.id, member.member.id));

    expect(row?.role).toBe("member");
    expect(row?.emailVerified).toBe(true);
    expect(membership?.role).toBe("member");
  });

  it("sign-up cannot choose a role", async () => {
    const response = await call(new Headers(), "POST", "/sign-up/email", {
      email: `signup-${Math.random().toString(36).slice(2, 10)}@example.test`,
      password: "a-long-enough-password",
      name: "New Person",
      role: "owner",
    });
    const body = (await response.json()) as { user?: { id: string } };

    if (body.user) {
      world.trackUser(body.user.id);

      const [row] = await db
        .select()
        .from(users)
        .where(eq(users.id, body.user.id));

      expect(row?.role).toBe("member");
    } else {
      expect(response.status).toBeGreaterThanOrEqual(400);
    }
  });

  it("deleting an account is not offered", async () => {
    const org = await world.org("Delete user");
    const owner = await world.userIn(org, "owner");
    const response = await call(
      await world.sessionHeaders(owner.user, org),
      "POST",
      "/delete-user",
      {},
    );

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(
      await db.select().from(users).where(eq(users.id, owner.user.id)),
    ).toHaveLength(1);
  });
});
