import { randomUUID } from "node:crypto";

import { createDatabaseAtMigration } from "@zentro/test-utils";
import { beforeAll, describe, expect, it } from "vitest";

// The activity migration is the 14th (index 13). Build a database as it was
// before, fill it with old task activity and permission log rows, then apply
// the migration.
const beforeActivityMigration = 13;

type Row = Record<string, unknown>;

describe("activity event backfill", () => {
  let db: Awaited<ReturnType<typeof createDatabaseAtMigration>>;
  const ids = {
    org: randomUUID(),
    otherOrg: randomUUID(),
    owner: randomUUID(),
    assignee: randomUUID(),
    ownerMember: randomUUID(),
    assigneeMember: randomUUID(),
    project: randomUUID(),
    team: randomUUID(),
    task: randomUUID(),
    comment: randomUUID(),
    ev: Array.from({ length: 6 }, () => randomUUID()),
    log: Array.from({ length: 6 }, () => randomUUID()),
  };

  beforeAll(async () => {
    db = await createDatabaseAtMigration(
      "zentro_backfill_test",
      beforeActivityMigration,
    );

    for (const [id, name] of [
      [ids.owner, "Olive Owner"],
      [ids.assignee, "Sam Assignee"],
    ] as const) {
      await db.query(
        `insert into "user" (id, name, email, "emailVerified") values ($1, $2, $3, true)`,
        [id, name, `${id}@example.test`],
      );
    }

    for (const [id, name] of [
      [ids.org, "Org"],
      [ids.otherOrg, "Other"],
    ] as const) {
      await db.query(
        `insert into organization (id, name, slug) values ($1, $2, $3)`,
        [id, name, `org-${id.slice(0, 8)}`],
      );
    }

    await db.query(
      `insert into member (id, "organizationId", "userId", role) values ($1,$2,$3,'owner'), ($4,$2,$5,'member')`,
      [ids.ownerMember, ids.org, ids.owner, ids.assigneeMember, ids.assignee],
    );
    await db.query(
      `insert into team (id, "organizationId", name) values ($1, $2, 'Squad')`,
      [ids.team, ids.org],
    );
    await db.query(
      `insert into project (id, "organizationId", name, slug, "taskKeyPrefix", "teamId")
         values ($1, $2, 'Atlas', 'atlas', 'AT', $3)`,
      [ids.project, ids.org, ids.team],
    );
    await db.query(
      `insert into task (id, "organizationId", "projectId", "teamId", key, "taskNumber", name)
         values ($1, $2, $3, $4, 'AT-1', 1, 'Plan')`,
      [ids.task, ids.org, ids.project, ids.team],
    );

    const at = (minutes: number) =>
      new Date(Date.UTC(2026, 0, 1, 12, minutes)).toISOString();
    const events: Array<
      [
        string,
        string,
        string | null,
        string | null,
        string | null,
        string | null,
        string,
      ]
    > = [
      [ids.ev[0]!, "task.created", null, null, null, null, at(0)],
      [
        ids.ev[1]!,
        "task.updated",
        "status",
        "todo",
        "in-progress",
        null,
        at(1),
      ],
      [ids.ev[2]!, "task.updated", "priority", "low", "high", null, at(2)],
      [
        ids.ev[3]!,
        "task.updated",
        "assignedToMemberId",
        null,
        ids.assigneeMember,
        null,
        at(3),
      ],
      [ids.ev[4]!, "comment.created", null, null, null, ids.comment, at(4)],
      [ids.ev[5]!, "task.deleted", null, null, null, null, at(5)],
    ];

    for (const [id, type, field, from, to, commentId, createdAt] of events) {
      await db.query(
        `insert into "taskActivityEvent" (id, "organizationId", "taskId", "actorMemberId", type, field, "fromValue", "toValue", "commentId", "createdAt")
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          id,
          ids.org,
          ids.task,
          ids.ownerMember,
          type,
          field,
          from,
          to,
          commentId,
          createdAt,
        ],
      );
    }

    const logs: Array<[string, string, string, string, unknown, unknown]> = [
      [
        ids.log[0]!,
        "role.created",
        "role",
        randomUUID(),
        null,
        { name: "Reviewer" },
      ],
      [
        ids.log[1]!,
        "override.created",
        "user",
        ids.assignee,
        null,
        { permission: "tasks.view" },
      ],
      [
        ids.log[2]!,
        "member.role.updated",
        "member",
        ids.assigneeMember,
        { role: "member" },
        { role: "admin" },
      ],
      [
        ids.log[3]!,
        "project.access.updated",
        "project",
        ids.project,
        { visibility: "organization" },
        { visibility: "private" },
      ],
      [
        ids.log[4]!,
        "assignment.created",
        "team",
        ids.team,
        null,
        { roleName: "Team lead" },
      ],
      [ids.log[5]!, "something.else", "role", "not-a-uuid", null, null],
    ];

    for (const [id, action, targetType, targetId, before, after] of logs) {
      await db.query(
        `insert into "permissionChangeLog" (id, "organizationId", "actorUserId", action, "targetType", "targetId", before, after, "createdAt")
           values ($1,$2,$3,$4,$5,$6,$7,$8,'2026-01-01T13:00:00Z')`,
        [
          id,
          ids.org,
          ids.owner,
          action,
          targetType,
          targetId,
          before === null ? null : JSON.stringify(before),
          after === null ? null : JSON.stringify(after),
        ],
      );
    }

    await db.query(
      `insert into role (id, "organizationId", name, scope, kind, "systemKey", permissions)
         values ($1,$2,'Admin','organization','system','admin','["members.view","tasks.view"]'),
                ($3,$2,'Member','organization','system','member','["tasks.view"]')`,
      [randomUUID(), ids.org, randomUUID()],
    );

    await db.migrateToLatest();
  });

  const events = () =>
    db.query<Row>(
      `select * from "activityEvent" where "organizationId" = $1 order by "createdAt", id`,
      [ids.org],
    );

  it("copies every task activity and permission log row", async () => {
    expect(await events()).toHaveLength(12);
  });

  it("keeps ids, timestamps and the old tables", async () => {
    const copied = await events();

    for (const id of [...ids.ev, ...ids.log]) {
      expect(
        copied.some((row) => row.id === id),
        id,
      ).toBe(true);
    }

    // Timestamps are copied as they were, compared inside the database.
    expect(
      await db.query(
        `select 1 from "activityEvent" a join "taskActivityEvent" t on t.id = a.id
           where a."createdAt" = t."createdAt"`,
      ),
    ).toHaveLength(6);
    expect(
      await db.query(
        `select 1 from "activityEvent" a join "permissionChangeLog" l on l.id = a.id
           where a."createdAt" = l."createdAt"`,
      ),
    ).toHaveLength(6);
    expect(await db.query(`select 1 from "taskActivityEvent"`)).toHaveLength(6);
    expect(await db.query(`select 1 from "permissionChangeLog"`)).toHaveLength(
      6,
    );
  });

  it("maps task events to action keys, labels, project and team", async () => {
    const byId = Object.fromEntries(
      (await events()).map((row) => [row.id as string, row]),
    );

    expect(byId[ids.ev[0]!]).toMatchObject({
      action: "task.created",
      targetType: "task",
      targetId: ids.task,
      targetLabel: "AT-1",
      projectId: ids.project,
      teamId: ids.team,
      actorUserId: ids.owner,
      auditOnly: false,
    });
    expect(byId[ids.ev[1]!]).toMatchObject({ action: "task.status_changed" });
    expect(byId[ids.ev[1]!]!.metadata).toMatchObject({
      changes: [{ field: "status", from: "todo", to: "in-progress" }],
    });
    expect(byId[ids.ev[2]!]).toMatchObject({ action: "task.updated" });
    expect(byId[ids.ev[3]!]).toMatchObject({ action: "task.assigned" });
    expect(byId[ids.ev[3]!]!.metadata).toMatchObject({
      changes: [{ field: "assignee", from: null, to: "Sam Assignee" }],
    });
    expect(byId[ids.ev[4]!]).toMatchObject({ action: "task.comment_added" });
    expect(byId[ids.ev[4]!]!.metadata).toMatchObject({
      commentId: ids.comment,
    });
    expect(byId[ids.ev[5]!]).toMatchObject({ action: "task.deleted" });
  });

  it("maps permission log rows, keeping before and after", async () => {
    const byId = Object.fromEntries(
      (await events()).map((row) => [row.id as string, row]),
    );

    expect(byId[ids.log[0]!]).toMatchObject({
      action: "role.created",
      auditOnly: true,
      targetLabel: "Reviewer",
    });
    expect(byId[ids.log[1]!]).toMatchObject({ action: "override.set" });
    expect(byId[ids.log[2]!]).toMatchObject({ action: "member.role_updated" });
    expect(byId[ids.log[2]!]!.metadata).toMatchObject({
      before: { role: "member" },
      after: { role: "admin" },
    });
    expect(byId[ids.log[3]!]).toMatchObject({
      action: "project.visibility_changed",
      projectId: ids.project,
    });
    expect(byId[ids.log[4]!]).toMatchObject({
      action: "assignment.created",
      teamId: ids.team,
      targetLabel: "Team lead",
    });
    expect(byId[ids.log[5]!]).toMatchObject({
      action: "something.else",
      projectId: null,
    });
  });

  it("marks the old default keys as applied on system roles", async () => {
    const [admin] = await db.query<{
      appliedDefaults: string[];
      permissions: string[];
    }>(
      `select "appliedDefaults", permissions from role where "systemKey" = 'admin'`,
    );

    // Not the keys the role had in this fixture, but the defaults of the time:
    // a key the administrator removed must not come back.
    expect(admin!.appliedDefaults).toContain("roles.view");
    expect(admin!.appliedDefaults).not.toContain("audit_logs.view");
    expect(admin!.permissions).toEqual(["members.view", "tasks.view"]);
  });

  it("is idempotent when the copy statements run again", async () => {
    const before = (await events()).length;

    await db.query(`
      INSERT INTO "activityEvent" ("id", "organizationId", "actorUserId", "action", "targetType", "targetId", "auditOnly", "metadata", "createdAt")
      SELECT l."id", l."organizationId", l."actorUserId", l."action", l."targetType", l."targetId", true, '{}'::jsonb, l."createdAt"
      FROM "permissionChangeLog" l
      ON CONFLICT ("id") DO NOTHING`);
    expect(await events()).toHaveLength(before);
  });
});
