import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { insertActivityEvent } from "@zentro/audit/server";
import { db } from "@zentro/db";
import { eq } from "@zentro/db/drizzle";
import { activityEvents } from "@zentro/db/schema";
import { afterAll, describe, expect, it } from "vitest";

import { World } from "./helpers";

const world = new World();

afterAll(() => world.cleanup());

const repoRoot = path.resolve(import.meta.dirname, "../../..");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    if (["node_modules", ".next", "dist", ".turbo"].includes(name)) {
      return [];
    }

    const full = path.join(dir, name);

    return statSync(full).isDirectory()
      ? sourceFiles(full)
      : /\.(ts|tsx|sql)$/.test(name)
        ? [full]
        : [];
  });
}

describe("the activity store is append-only", () => {
  const files = [
    ...sourceFiles(path.join(repoRoot, "packages")),
    ...sourceFiles(path.join(repoRoot, "apps/web/src")),
  ].filter((file) => !file.includes(`${path.sep}test${path.sep}`));

  it("scans the source tree", () => {
    expect(files.length).toBeGreaterThan(100);
  });

  it("never updates or deletes activity events in application code", () => {
    const patterns = [
      /\.\s*update\(\s*activityEvents\b/,
      /\.\s*delete\(\s*activityEvents\b/,
      /update\s+"activityEvent"/i,
      /delete\s+from\s+"activityEvent"/i,
      /truncate\s+(table\s+)?"activityEvent"/i,
    ];

    for (const file of files) {
      const text = readFileSync(file, "utf8");

      for (const pattern of patterns) {
        expect(
          pattern.test(text),
          `${path.relative(repoRoot, file)} matches ${pattern}`,
        ).toBe(false);
      }
    }
  });

  it("exposes no procedure that could change events", async () => {
    const { appRouter } = await import("../src/server/root");

    for (const [path, procedure] of Object.entries(appRouter._def.procedures)) {
      if (path.startsWith("activity.") || path.startsWith("audit.")) {
        const type = (procedure as unknown as { _def: { type: string } })._def
          .type;

        // The one mutation is the export, which only reads and records itself.
        expect(type === "query" || path === "audit.export", path).toBe(true);
      }
    }
  });
});

describe("what is stored", () => {
  it("removes secrets from metadata at any depth", async () => {
    const org = await world.org("Redaction");
    const event = await insertActivityEvent(db, {
      organizationId: org.id,
      actorUserId: null,
      action: "role.updated",
      target: { id: "x", label: "Label" },
      metadata: {
        keep: "yes",
        password: "hunter2",
        nested: {
          sessionToken: "abc",
          otp: "123456",
          deep: [{ clientSecret: "s", ok: 1 }],
        },
        authorization: "Bearer x",
        cookie: "a=b",
      },
    });
    const [stored] = await db
      .select()
      .from(activityEvents)
      .where(eq(activityEvents.id, event.id));

    expect(stored!.metadata).toEqual({
      keep: "yes",
      nested: { deep: [{ ok: 1 }] },
    });
    expect(JSON.stringify(stored)).not.toMatch(/hunter2|abc|123456|Bearer/);
  });

  it("refuses unknown actions and derives audit-only from the catalog", async () => {
    const org = await world.org("Catalog");

    await expect(
      insertActivityEvent(db, {
        organizationId: org.id,
        actorUserId: null,
        action: "made.up",
        target: { id: "x" },
      }),
    ).rejects.toThrow(/Unknown audit event/);

    const login = await insertActivityEvent(db, {
      organizationId: org.id,
      actorUserId: null,
      action: "auth.sign_in",
      target: { id: "x" },
    });
    const task = await insertActivityEvent(db, {
      organizationId: org.id,
      actorUserId: null,
      action: "task.created",
      target: { id: "x" },
    });

    expect(login).toMatchObject({ auditOnly: true, targetType: "session" });
    expect(task).toMatchObject({ auditOnly: false, targetType: "task" });
  });

  it("keeps events when the actor's account is deleted, as a deleted user", async () => {
    const org = await world.org("Deleted actor");
    const { user } = await world.userIn(org, "owner", "Soon Gone");

    await insertActivityEvent(db, {
      organizationId: org.id,
      actorUserId: user.id,
      action: "task.created",
      target: { id: "t", label: "KEY-1" },
    });

    const { users } = await import("@zentro/db/schema");

    await db.delete(users).where(eq(users.id, user.id));

    const [row] = await db
      .select()
      .from(activityEvents)
      .where(eq(activityEvents.organizationId, org.id));

    expect(row).toMatchObject({ actorUserId: null, targetLabel: "KEY-1" });
  });

  it("goes away only with its organization", async () => {
    const org = await world.org("Cascade");

    await insertActivityEvent(db, {
      organizationId: org.id,
      actorUserId: null,
      action: "task.created",
      target: { id: "t" },
    });

    const { organizations } = await import("@zentro/db/schema");

    await db.delete(organizations).where(eq(organizations.id, org.id));
    expect(
      await db
        .select()
        .from(activityEvents)
        .where(eq(activityEvents.organizationId, org.id)),
    ).toHaveLength(0);
  });
});
