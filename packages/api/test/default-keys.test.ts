import { ensureSystemRoles } from "@zentro/auth";
import { db } from "@zentro/db";
import { and, eq } from "@zentro/db/drizzle";
import { roles } from "@zentro/db/schema";
import { getSystemRoleDefinition } from "@zentro/permissions";
import { afterAll, describe, expect, it } from "vitest";

import { World, type TestOrg } from "./helpers";

const world = new World();

afterAll(() => world.cleanup());

const newKeys = ["audit_logs.view", "audit_logs.export", "activity.view_org"];

async function role(org: TestOrg, systemKey: string) {
  const [row] = await db
    .select()
    .from(roles)
    .where(
      and(eq(roles.organizationId, org.id), eq(roles.systemKey, systemKey)),
    );

  return row!;
}

/** An organization as it was before the new keys existed. */
async function legacyOrg(removedByAdmin: string[] = []) {
  const org = await world.org("Legacy");

  await ensureSystemRoles(db, org.id);

  for (const systemKey of ["owner", "admin", "member"] as const) {
    const defaults = getSystemRoleDefinition(systemKey)!.permissions.filter(
      (key) => !newKeys.includes(key),
    );

    await db
      .update(roles)
      .set({
        permissions: defaults.filter(
          (key) => !(systemKey === "admin" && removedByAdmin.includes(key)),
        ),
        appliedDefaults: defaults,
      })
      .where(
        and(eq(roles.organizationId, org.id), eq(roles.systemKey, systemKey)),
      );
  }

  return org;
}

describe("new default keys reach existing system roles", () => {
  it("gives Admin the new keys on first access, and Member none", async () => {
    const org = await legacyOrg();
    const { user } = await world.userIn(org, "admin");

    // The first permission check runs the seeding.
    const me = await (await world.caller(user, org)).permissions.me();

    for (const key of newKeys) {
      expect(me.permissions[key], key).toBe(true);
    }

    const admin = await role(org, "admin");
    const member = await role(org, "member");
    const owner = await role(org, "owner");

    for (const key of newKeys) {
      expect(admin.permissions).toContain(key);
      expect(admin.appliedDefaults).toContain(key);
      expect(member.permissions).not.toContain(key);
      expect(owner.permissions).toContain(key);
    }
  });

  it("does not give back a key an administrator removed", async () => {
    const org = await legacyOrg(["tasks.delete_any", "roles.delete"]);

    await ensureSystemRoles(db, org.id);

    const admin = await role(org, "admin");

    expect(admin.permissions).toContain("audit_logs.view");
    expect(admin.permissions).not.toContain("tasks.delete_any");
    expect(admin.permissions).not.toContain("roles.delete");
  });

  it("keeps a new key removed once it was applied", async () => {
    const org = await legacyOrg();

    await ensureSystemRoles(db, org.id);

    const admin = await role(org, "admin");

    await db
      .update(roles)
      .set({
        permissions: admin.permissions.filter(
          (key) => key !== "audit_logs.export",
        ),
      })
      .where(eq(roles.id, admin.id));

    await ensureSystemRoles(db, org.id);
    await ensureSystemRoles(db, org.id);

    expect((await role(org, "admin")).permissions).not.toContain(
      "audit_logs.export",
    );
  });

  it("is safe when many requests seed at once", async () => {
    const org = await legacyOrg(["tasks.delete_any"]);

    await Promise.all(
      Array.from({ length: 16 }, () => ensureSystemRoles(db, org.id)),
    );

    const admin = await role(org, "admin");

    for (const key of newKeys) {
      expect(
        admin.permissions.filter((item) => item === key),
        key,
      ).toHaveLength(1);
    }

    expect(admin.permissions).not.toContain("tasks.delete_any");
    expect(new Set(admin.permissions).size).toBe(admin.permissions.length);
  });

  it("does not overwrite an edit made while seeding", async () => {
    const org = await legacyOrg();
    const before = await role(org, "member");

    // An administrator edits Member; the seeding that follows keeps the edit.
    await db
      .update(roles)
      .set({ permissions: [...before.permissions, "projects.create"] })
      .where(eq(roles.id, before.id));
    await ensureSystemRoles(db, org.id);

    expect((await role(org, "member")).permissions).toContain(
      "projects.create",
    );
  });

  it("starts new organizations with every default applied", async () => {
    const org = await world.org("Fresh");

    await ensureSystemRoles(db, org.id);

    for (const systemKey of ["owner", "admin", "member"]) {
      const row = await role(org, systemKey);

      expect(row.appliedDefaults.sort()).toEqual([...row.permissions].sort());
    }

    const admin = await role(org, "admin");

    for (const key of newKeys) {
      expect(admin.permissions).toContain(key);
    }
  });

  it("marks defaults as applied when a system role is reset", async () => {
    const org = await world.org("Reset");
    const owner = await world.userIn(org, "owner");
    const as = await world.caller(owner.user, org);

    await as.permissions.roles.resetSystem({ systemKey: "admin" });

    const admin = await role(org, "admin");

    expect(admin.appliedDefaults).toEqual(
      getSystemRoleDefinition("admin")!.permissions,
    );
  });
});
