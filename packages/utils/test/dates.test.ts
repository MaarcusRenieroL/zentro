import { describe, expect, it } from "vitest";

import { formatDueDate, formatEventTime } from "../src";

const now = new Date("2026-10-14T10:00:00");

describe("formatDueDate", () => {
  it("shows No date for empty or invalid values", () => {
    expect(formatDueDate(null, now)).toMatchObject({
      text: "No date",
      tone: "none",
    });
    expect(formatDueDate("nope", now).tone).toBe("none");
  });

  it("uses relative words around today", () => {
    expect(formatDueDate("2026-10-14T23:00:00", now)).toMatchObject({
      text: "Today",
      tone: "soon",
    });
    expect(formatDueDate("2026-10-15T09:00:00", now)).toMatchObject({
      text: "Tomorrow",
      tone: "soon",
    });
    expect(formatDueDate("2026-10-13T09:00:00", now)).toMatchObject({
      text: "Yesterday",
      tone: "overdue",
    });
  });

  it("drops the year for the current year only", () => {
    expect(formatDueDate("2026-10-18T09:00:00", now).text).toBe("Oct 18");
    expect(formatDueDate("2027-10-18T09:00:00", now).text).toBe("Oct 18, 2027");
  });

  it("colors by distance: overdue, within three days, later", () => {
    expect(formatDueDate("2026-10-01T09:00:00", now).tone).toBe("overdue");
    expect(formatDueDate("2026-10-17T09:00:00", now).tone).toBe("soon");
    expect(formatDueDate("2026-10-18T09:00:00", now).tone).toBe("later");
  });

  it("keeps the full date for tooltips", () => {
    expect(formatDueDate("2026-10-18T09:00:00", now).full).toBe(
      "Sunday, October 18, 2026",
    );
  });
});

describe("formatEventTime", () => {
  it("reads naturally for today, yesterday and older", () => {
    expect(formatEventTime("2026-10-14T09:05:00", now)).toBe("Today, 9:05 AM");
    expect(formatEventTime("2026-10-13T21:30:00", now)).toBe(
      "Yesterday, 9:30 PM",
    );
    expect(formatEventTime("2026-09-02T08:00:00", now)).toBe("Sep 2, 8:00 AM");
    expect(formatEventTime("2025-09-02T08:00:00", now)).toBe(
      "Sep 2, 2025, 8:00 AM",
    );
  });
});
