import { describe, expect, it } from "vitest";

import { reachablePermissions } from "../src";
import {
  assign,
  customRole,
  PROJECT,
  OTHER_PROJECT,
  snapshot,
  TEAM,
} from "./helpers";

const keys = ["projects.view", "tasks.view", "docs.view", "tasks.update_any"];
const projects = [
  { id: PROJECT, teamId: null, visibility: "organization" as const },
  { id: OTHER_PROJECT, teamId: null, visibility: "organization" as const },
];

describe("reachablePermissions", () => {
  it("is everything for owners", () => {
    const result = reachablePermissions(
      snapshot({ baseRole: "owner" }),
      projects,
      keys,
    );

    expect(Object.values(result).every(Boolean)).toBe(true);
  });

  it("follows the base role when granted organization-wide", () => {
    const result = reachablePermissions(snapshot(), [], keys);

    expect(result["tasks.view"]).toBe(true);
    expect(result["projects.view"]).toBe(true);
  });

  it("reaches a module through a role on one project only", () => {
    const base = snapshot({
      baseRole: "member",
      extraRoles: [],
    });
    // Nothing organization-wide: replace the Member role with an empty one.
    const stripped = {
      ...base,
      roles: base.roles.map((role) =>
        role.systemKey === "member" ? { ...role, permissions: [] } : role,
      ),
      assignments: [assign("system-project_member", "project", PROJECT)],
    };
    const result = reachablePermissions(stripped, projects, keys);

    expect(result["projects.view"]).toBe(true);
    expect(result["tasks.view"]).toBe(true);
    expect(result["docs.view"]).toBe(true);
    expect(result["tasks.update_any"]).toBe(true);
  });

  it("does not reach what no project role grants", () => {
    const base = snapshot();
    const stripped = {
      ...base,
      roles: base.roles.map((role) =>
        role.systemKey === "member" ? { ...role, permissions: [] } : role,
      ),
      assignments: [assign("system-project_viewer", "project", PROJECT)],
    };
    const result = reachablePermissions(stripped, projects, keys);

    expect(result["tasks.view"]).toBe(true);
    expect(result["tasks.update_any"]).toBe(false);
  });

  it("reaches a module through a role given on a team", () => {
    const reader = customRole("team-reader", ["tasks.view"], "team");
    const base = snapshot({ extraRoles: [reader] });
    const stripped = {
      ...base,
      roles: base.roles.map((role) =>
        role.systemKey === "member" ? { ...role, permissions: [] } : role,
      ),
      assignments: [assign("team-reader", "team", TEAM)],
    };

    expect(reachablePermissions(stripped, [], keys)["tasks.view"]).toBe(true);
    expect(reachablePermissions(stripped, [], keys)["docs.view"]).toBe(false);
  });

  it("reaches nothing without any role", () => {
    const base = snapshot();
    const stripped = {
      ...base,
      roles: base.roles.map((role) =>
        role.systemKey === "member" ? { ...role, permissions: [] } : role,
      ),
    };
    const result = reachablePermissions(stripped, projects, keys);

    expect(Object.values(result).some(Boolean)).toBe(false);
  });
});
