import { describe, expect, it } from "vitest";

import { appRouter } from "../src/server/root";
import { anonymousCaller } from "./helpers";

// Procedures that are allowed to answer callers without a session. Adding a
// public procedure anywhere in the router makes the sweep below fail until the
// new procedure is listed here with a reason.
const publicByDesign: Record<string, string> = {
  health: "Liveness probe; returns a static payload.",
};

const procedurePaths = Object.keys(appRouter._def.procedures).sort();

function resolveProcedure(caller: object, path: string) {
  return path
    .split(".")
    .reduce<unknown>(
      (node, segment) => (node as Record<string, unknown>)[segment],
      caller,
    ) as (input?: unknown) => Promise<unknown>;
}

describe("unauthenticated sweep", () => {
  it("enumerates the router's procedures", () => {
    expect(procedurePaths.length).toBeGreaterThan(40);
    expect(procedurePaths).toContain("project.createProject");
  });

  it("only lists real procedures in the allowlist", () => {
    for (const path of Object.keys(publicByDesign)) {
      expect(procedurePaths, path).toContain(path);
    }
  });

  for (const path of procedurePaths) {
    if (path in publicByDesign) {
      continue;
    }

    it(`${path} rejects callers without a session`, async () => {
      const procedure = resolveProcedure(anonymousCaller(), path);

      await expect(procedure(undefined)).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });
    });
  }
});

describe("public procedures", () => {
  it("health answers without a session", async () => {
    await expect(anonymousCaller().health()).resolves.toMatchObject({
      status: "ok",
    });
  });
});
