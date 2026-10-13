import { describe, expect, it } from "vitest";

import {
  canDisable,
  canEnable,
  dependentsOf,
  getModule,
  listModules,
  resolveEnabled,
} from "../src";

describe("resolveEnabled", () => {
  it("uses defaultEnabled when no rows exist", () => {
    const enabled = resolveEnabled([]);

    expect([...enabled].sort()).toEqual(
      listModules()
        .filter((manifest) => manifest.defaultEnabled)
        .map((manifest) => manifest.id)
        .sort(),
    );
  });

  it("lets a stored row override the default", () => {
    const enabled = resolveEnabled([{ moduleId: "docs", enabled: false }]);

    expect(enabled.has("docs")).toBe(false);
    expect(enabled.has("tasks")).toBe(true);
  });

  it("enables a module that a row turns on", () => {
    expect(
      resolveEnabled([{ moduleId: "tasks", enabled: true }]).has("tasks"),
    ).toBe(true);
  });

  it("keeps core modules on even when a row says otherwise", () => {
    const enabled = resolveEnabled([
      { moduleId: "dashboard", enabled: false },
      { moduleId: "settings", enabled: false },
    ]);

    expect(enabled.has("dashboard")).toBe(true);
    expect(enabled.has("settings")).toBe(true);
  });

  it("ignores rows for unknown modules", () => {
    const enabled = resolveEnabled([{ moduleId: "nope", enabled: true }]);

    expect(enabled.has("nope" as never)).toBe(false);
  });
});

describe("dependentsOf", () => {
  it("lists the modules that depend on a module", () => {
    expect(dependentsOf("projects").map((manifest) => manifest.id)).toEqual([
      "tasks",
    ]);
  });

  it("returns an empty list for a module nothing depends on", () => {
    expect(dependentsOf("docs")).toEqual([]);
    expect(dependentsOf("unknown")).toEqual([]);
  });
});

describe("canEnable", () => {
  it("blocks a module whose dependency is off", () => {
    const result = canEnable("tasks", new Set(["dashboard", "settings"]));

    expect(result).toEqual({
      allowed: false,
      reason: "Requires Projects to be enabled.",
    });
  });

  it("allows a module whose dependencies are on", () => {
    expect(canEnable("tasks", new Set(["projects"]))).toEqual({
      allowed: true,
    });
  });

  it("allows a module without dependencies", () => {
    expect(canEnable("docs", new Set())).toEqual({ allowed: true });
  });

  it("rejects unknown modules", () => {
    expect(canEnable("nope", new Set())).toMatchObject({ allowed: false });
  });
});

describe("canDisable", () => {
  it("blocks disabling a module while a dependent is enabled", () => {
    expect(canDisable("projects", new Set(["projects", "tasks"]))).toEqual({
      allowed: false,
      reason: "Turn off Tasks first.",
    });
  });

  it("allows disabling once dependents are off", () => {
    expect(canDisable("projects", new Set(["projects"]))).toEqual({
      allowed: true,
    });
  });

  it("never allows disabling core modules", () => {
    expect(canDisable("dashboard", new Set(["dashboard"]))).toMatchObject({
      allowed: false,
    });
    expect(canDisable("settings", new Set(["settings"]))).toMatchObject({
      allowed: false,
    });
  });

  it("rejects unknown modules", () => {
    expect(canDisable("nope", new Set())).toMatchObject({ allowed: false });
  });
});

describe("getModule", () => {
  it("finds registered modules", () => {
    expect(getModule("tasks")?.dependsOn).toEqual(["projects"]);
  });

  it("returns undefined for unknown ids", () => {
    expect(getModule("nope")).toBeUndefined();
  });
});
