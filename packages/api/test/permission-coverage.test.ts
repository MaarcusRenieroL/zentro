import { getCatalog, engineEnforcedKeys } from "@zentro/permissions";
import { describe, expect, it } from "vitest";

import { appRouter } from "../src/server/root";

type Meta = { permissions?: string[] } | undefined;

const procedures = Object.entries(appRouter._def.procedures).map(
  ([path, procedure]) => ({
    path,
    permissions: ((procedure as { _def: { meta?: Meta } })._def.meta
      ?.permissions ?? []) as string[],
  }),
);

// Procedures that do not enforce a catalog permission, each with the reason.
// A new procedure must declare permission keys (use permissionProcedure or
// listProcedure) or be added here on purpose; the test fails otherwise.
const unmanaged: Record<string, string> = {
  health: "Public liveness probe; returns a static payload.",
  "organization.getInviteDetails":
    "Authenticated only; returns an invitation to the user it was sent to.",
  "user.listPendingInvites":
    "Authenticated only; lists the signed-in user's own invitations.",
  "permissions.me":
    "Signed-in members read their own permissions; nothing about anyone else.",
  "permissions.check":
    "Signed-in members read their own permissions for one project or team.",
  "file.getFiles": "Stub that returns null; no data behind it yet.",
  "search.searchById": "Stub that returns null; no data behind it yet.",
};

// Procedures whose permission is checked in the handler (scope depends on the
// input) rather than by permissionProcedure. They still declare `meta`.
const metaOnly = new Set([
  "permissions.assignments.assign",
  "permissions.assignments.unassign",
  "permissions.overrides.set",
  "permissions.overrides.remove",
]);

const catalogKeys = new Set(getCatalog().map((entry) => entry.key));

describe("permission coverage", () => {
  it("enumerates the router's procedures", () => {
    expect(procedures.length).toBeGreaterThan(60);
  });

  it("only allowlists real procedures", () => {
    const paths = new Set(procedures.map((procedure) => procedure.path));

    for (const path of Object.keys(unmanaged)) {
      expect(paths.has(path), path).toBe(true);
    }
  });

  for (const { path, permissions } of procedures) {
    if (path in unmanaged && !metaOnly.has(path)) {
      it(`${path} is an allowlisted unmanaged procedure`, () => {
        expect(
          permissions,
          `${path} declares keys and needs no allowlist entry`,
        ).toEqual([]);
      });

      continue;
    }

    it(`${path} declares permission keys from the catalog`, () => {
      expect(permissions.length, `${path} has no permission`).toBeGreaterThan(
        0,
      );

      for (const key of permissions) {
        expect(catalogKeys.has(key), `${path}: ${key}`).toBe(true);
      }
    });
  }

  it("uses every catalog key in a procedure, or marks it uiOnly with a reason", () => {
    const used = new Set(
      procedures.flatMap((procedure) => procedure.permissions),
    );

    for (const key of engineEnforcedKeys) {
      used.add(key);
    }

    for (const entry of getCatalog()) {
      const counterpart = entry.key.endsWith("_any")
        ? entry.key.replace(/_any$/, "_own")
        : entry.key;

      if (used.has(entry.key) || used.has(counterpart)) {
        continue;
      }

      expect(
        entry.uiOnly,
        `${entry.key} is not enforced by any procedure and is not marked uiOnly`,
      ).toBeTruthy();
    }
  });

  it("does not mark an enforced key as uiOnly", () => {
    const used = new Set(
      procedures.flatMap((procedure) => procedure.permissions),
    );

    for (const entry of getCatalog()) {
      if (entry.uiOnly) {
        expect(
          used.has(entry.key),
          `${entry.key} is enforced but marked uiOnly`,
        ).toBe(false);
      }
    }
  });
});
