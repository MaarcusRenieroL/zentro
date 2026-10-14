import { describe, expect, it } from "vitest";

import { describeFocusReason, pickFocus, rankTasks } from "../src";

const now = new Date("2026-10-14T10:00:00");
const task = (key: string, extra: Record<string, unknown> = {}) => ({
  key,
  status: "todo",
  priority: "medium",
  dueAt: null as Date | string | null,
  createdAt: "2026-10-01T09:00:00",
  ...extra,
});

describe("pickFocus", () => {
  it("returns null when there is nothing to do", () => {
    expect(pickFocus([], now)).toBeNull();
    expect(pickFocus([task("A-1", { status: "done" })], now)).toBeNull();
  });

  it("puts overdue before due today before high priority before oldest", () => {
    const picked = rankTasks(
      [
        task("OLD-1", { createdAt: "2026-09-01T09:00:00" }),
        task("HIGH-1", { priority: "high" }),
        task("TODAY-1", { dueAt: "2026-10-14T17:00:00" }),
        task("LATE-1", { dueAt: "2026-10-12T17:00:00" }),
      ],
      now,
    ).map((item) => item.task.key);

    expect(picked).toEqual(["LATE-1", "TODAY-1", "HIGH-1", "OLD-1"]);
  });

  it("explains the choice", () => {
    expect(
      pickFocus([task("A-1", { dueAt: "2026-10-12T12:00:00" })], now)?.reason,
    ).toEqual({
      kind: "overdue",
      days: 2,
    });
    expect(
      pickFocus([task("A-2", { dueAt: "2026-10-14T23:00:00" })], now)?.reason,
    ).toEqual({
      kind: "due-today",
    });
    expect(pickFocus([task("A-3", { priority: "high" })], now)?.reason).toEqual(
      {
        kind: "high-priority",
      },
    );
    expect(pickFocus([task("A-4")], now)?.reason).toEqual({ kind: "oldest" });
  });

  it("takes the most overdue first, and the oldest when otherwise equal", () => {
    const [first] = rankTasks(
      [
        task("B-1", { dueAt: "2026-10-13T10:00:00" }),
        task("B-2", { dueAt: "2026-10-10T10:00:00" }),
      ],
      now,
    );

    expect(first?.task.key).toBe("B-2");
    expect(
      pickFocus(
        [
          task("C-1", { createdAt: "2026-10-05T09:00:00" }),
          task("C-2", { createdAt: "2026-10-02T09:00:00" }),
        ],
        now,
      )?.task.key,
    ).toBe("C-2");
  });

  it("keeps a task you started first within its tier", () => {
    expect(
      pickFocus(
        [
          task("D-1", { createdAt: "2026-09-01T09:00:00" }),
          task("D-2", {
            status: "in-progress",
            createdAt: "2026-10-09T09:00:00",
          }),
        ],
        now,
      )?.task.key,
    ).toBe("D-2");
  });

  it("skips tasks waiting in review", () => {
    expect(
      pickFocus(
        [task("E-1", { status: "review", dueAt: "2026-10-01T00:00:00" })],
        now,
      ),
    ).toBeNull();
  });

  it("writes a calm sentence for every reason", () => {
    expect(describeFocusReason({ kind: "overdue", days: 1 })).toMatch(
      /yesterday/,
    );
    expect(describeFocusReason({ kind: "overdue", days: 3 })).toMatch(/3 days/);
    expect(describeFocusReason({ kind: "due-today" })).toBe("Due today.");
  });
});
