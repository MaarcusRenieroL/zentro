import { listModules } from "@zentro/modules";
import { describe, expect, it } from "vitest";

import {
  actorName,
  auditCatalog,
  buildChanges,
  buildCsv,
  csvCell,
  describeEvent,
  getAuditEvent,
  redactSecrets,
  toChangeValue,
} from "../src";

const targetTypes = [
  "organization",
  "member",
  "invitation",
  "team",
  "project",
  "task",
  "channel",
  "doc",
  "comment",
  "role",
  "assignment",
  "override",
  "module",
  "session",
  "user",
  "audit",
  "file",
  "event",
  "board",
];

describe("event catalog", () => {
  it("has unique dotted keys", () => {
    const keys = auditCatalog.map((entry) => entry.key);

    expect(new Set(keys).size).toBe(keys.length);

    for (const key of keys) {
      expect(key).toMatch(/^[a-z]+\.[a-z_]+$/);
    }
  });

  it("uses valid target types and real modules", () => {
    const modules = new Set<string>([
      "platform",
      ...listModules().map((manifest) => manifest.id),
    ]);

    for (const entry of auditCatalog) {
      expect(targetTypes, entry.key).toContain(entry.targetType);
      expect(modules.has(entry.module), `${entry.key}: ${entry.module}`).toBe(
        true,
      );
    }
  });

  it("describes every event", () => {
    for (const entry of auditCatalog) {
      expect(entry.label.length, entry.key).toBeGreaterThan(3);
      expect(entry.description.length, entry.key).toBeGreaterThan(5);
      expect(entry.phrase.length, entry.key).toBeGreaterThan(3);
    }
  });

  it("keeps authentication events audit-only and hook-recorded", () => {
    for (const entry of auditCatalog.filter((item) =>
      item.key.startsWith("auth."),
    )) {
      expect(entry.auditOnly, entry.key).toBe(true);
      expect(entry.hookOnly, entry.key).toBeTruthy();
    }
  });

  it("keeps permission changes out of resource feeds", () => {
    for (const prefix of ["role.", "assignment.", "override.", "audit."]) {
      for (const entry of auditCatalog.filter((item) =>
        item.key.startsWith(prefix),
      )) {
        expect(entry.auditOnly, entry.key).toBe(true);
      }
    }
  });

  it("shows task and doc events in feeds", () => {
    for (const entry of auditCatalog.filter((item) =>
      /^(task|doc)\./.test(item.key),
    )) {
      expect(entry.auditOnly, entry.key).toBe(false);
    }
  });
});

describe("redactSecrets", () => {
  it("removes secret-looking keys at any depth", () => {
    expect(
      redactSecrets({
        name: "x",
        password: "p",
        nested: { Token: "t", ok: 1, list: [{ otp: "1", keep: true }] },
        sessionToken: "s",
        authorization: "Bearer x",
        Cookie: "c",
        clientSecret: "z",
        verificationCode: "1",
      }),
    ).toEqual({ name: "x", nested: { ok: 1, list: [{ keep: true }] } });
  });

  it("leaves other values alone", () => {
    const date = new Date();

    expect(redactSecrets({ at: date, n: 1, nul: null })).toEqual({
      at: date,
      n: 1,
      nul: null,
    });
    expect(redactSecrets("plain")).toBe("plain");
  });

  it("does not mutate its input", () => {
    const input = { password: "p", a: { token: "t" } };

    redactSecrets(input);
    expect(input).toEqual({ password: "p", a: { token: "t" } });
  });
});

describe("buildChanges", () => {
  it("lists only the fields that changed", () => {
    expect(
      buildChanges(
        { name: "A", status: "todo", priority: "low" },
        { name: "A", status: "done", priority: "high" },
      ),
    ).toEqual([
      { field: "status", from: "todo", to: "done" },
      { field: "priority", from: "low", to: "high" },
    ]);
  });

  it("ignores fields that were not part of the update", () => {
    expect(buildChanges({ a: 1, b: 2 }, { a: 1, b: undefined })).toEqual([]);
  });

  it("treats empty and missing values alike, and formats dates", () => {
    expect(buildChanges({ d: null }, { d: "" })).toEqual([]);
    expect(
      buildChanges({ d: null }, { d: new Date("2026-01-02T03:04:05.000Z") }),
    ).toEqual([{ field: "d", from: null, to: "2026-01-02T03:04:05.000Z" }]);
  });

  it("truncates long strings to 200 characters", () => {
    const [change] = buildChanges({ d: "" }, { d: "x".repeat(500) });

    expect(change!.to!.length).toBeLessThanOrEqual(201);
    expect(change!.to!.startsWith("x".repeat(200))).toBe(true);
    expect(toChangeValue("short")).toBe("short");
  });
});

describe("describeEvent", () => {
  const base = { targetType: "task", metadata: null };

  it("builds a status sentence from the changes", () => {
    expect(
      describeEvent(
        {
          ...base,
          action: "task.status_changed",
          targetLabel: "ZEN-12",
          metadata: {
            changes: [{ field: "status", from: "todo", to: "in-progress" }],
          },
        },
        "Priya",
      ),
    ).toBe("Priya moved ZEN-12 from To do to In progress");
  });

  it("describes assignment changes", () => {
    const event = {
      ...base,
      action: "task.assigned",
      targetLabel: "ZEN-1",
      metadata: { changes: [{ field: "assignee", from: null, to: "Sam" }] },
    };

    expect(describeEvent(event, "Priya")).toBe("Priya assigned ZEN-1 to Sam");
    expect(
      describeEvent(
        {
          ...event,
          metadata: { changes: [{ field: "assignee", from: "Sam", to: null }] },
        },
        "Priya",
      ),
    ).toBe("Priya unassigned ZEN-1 from Sam");
  });

  it("lists field changes for updates", () => {
    expect(
      describeEvent(
        {
          ...base,
          action: "task.updated",
          targetLabel: "ZEN-1",
          metadata: {
            changes: [{ field: "priority", from: "low", to: "high" }],
          },
        },
        "Priya",
      ),
    ).toBe("Priya updated ZEN-1: priority from low to high");
  });

  it("uses the catalog phrase and the snapshot label", () => {
    expect(
      describeEvent(
        {
          ...base,
          targetType: "doc",
          action: "doc.trashed",
          targetLabel: "Plan",
        },
        "Priya",
      ),
    ).toBe("Priya moved the doc Plan to the trash");
    expect(getAuditEvent("doc.trashed")?.auditOnly).toBe(false);
  });

  it("falls back for unknown actions and missing labels", () => {
    expect(
      describeEvent(
        { ...base, action: "thing.happened", targetLabel: "X" },
        "Priya",
      ),
    ).toBe("Priya thing.happened (X)");
    expect(
      describeEvent(
        { ...base, action: "task.created", targetLabel: null },
        "Priya",
      ),
    ).toBe("Priya created a task");
  });
});

describe("actorName", () => {
  it("names deleted users and the system", () => {
    expect(actorName(null, "some-id")).toBe("Deleted user");
    expect(actorName(null, null)).toBe("System");
    expect(actorName({ name: "Priya" }, "id")).toBe("Priya");
    expect(actorName({ name: "", email: "a@b.c" }, "id")).toBe("a@b.c");
  });
});

describe("csv", () => {
  it("quotes cells that need it", () => {
    expect(csvCell('a "b", c')).toBe('"a ""b"", c"');
    expect(csvCell("line\nbreak")).toBe('"line\nbreak"');
    expect(csvCell(null)).toBe("");
    expect(csvCell(new Date("2026-01-01T00:00:00.000Z"))).toBe(
      "2026-01-01T00:00:00.000Z",
    );
  });

  it("defuses spreadsheet formulas", () => {
    for (const value of ["=SUM(A1)", "+1", "-1+2", "@cmd"]) {
      expect(csvCell(value).startsWith("'")).toBe(true);
    }
  });

  it("builds rows with a header", () => {
    expect(buildCsv(["a", "b"], [[1, "x,y"]])).toBe('a,b\r\n1,"x,y"');
  });
});
