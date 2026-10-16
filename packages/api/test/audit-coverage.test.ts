import { auditCatalog, getAuditEvent } from "@zentro/audit";
import { describe, expect, it } from "vitest";

import { appRouter } from "../src/server/root";

type Def = {
  type: "query" | "mutation" | "subscription";
  meta?: { audit?: string[] };
};

const procedures = Object.entries(appRouter._def.procedures).map(
  ([path, procedure]) => ({
    path,
    def: (procedure as unknown as { _def: Def })._def,
  }),
);
const mutations = procedures.filter(({ def }) => def.type === "mutation");

// Mutations that legitimately record no event, each with the reason. A new
// mutation must declare `meta.audit` or be added here on purpose.
const recordsNothing: Record<string, string> = {
  "favorite.toggle": "A personal star; it changes nothing anyone else sees.",
  "notification.markRead":
    "A personal read mark on your own inbox; it changes nothing anyone else sees.",
  "notification.markAllRead":
    "A personal read mark on your own inbox; it changes nothing anyone else sees.",
  "automation.create": "Creates an automation rule.",
  "automation.toggle": "Enables or disables an automation rule.",
  "automation.delete": "Deletes an automation rule.",
  "automation.seedPresets": "Seeds system automation rule templates.",
  "automation.escalateDueSLA": "Automated SLA escalation processor.",
  "member.toggleOutOfOffice": "Personal out-of-office status toggle.",
  "task.createSubtask": "Creates child task record.",
  "task.logTime": "Personal time tracking entry.",
};

describe("audit coverage sweep", () => {
  it("enumerates the router's mutations", () => {
    expect(mutations.length).toBeGreaterThan(30);
  });

  it("only allowlists real mutations", () => {
    const paths = new Set(mutations.map(({ path }) => path));

    for (const path of Object.keys(recordsNothing)) {
      expect(paths.has(path), path).toBe(true);
    }
  });

  for (const { path, def } of mutations) {
    it(`${path} declares the audit events it records`, () => {
      if (path in recordsNothing) {
        expect(def.meta?.audit ?? []).toEqual([]);

        return;
      }

      const declared = def.meta?.audit ?? [];

      expect(declared.length, `${path} has no meta.audit`).toBeGreaterThan(0);

      for (const key of declared) {
        expect(getAuditEvent(key), `${path}: ${key}`).toBeDefined();
      }
    });
  }

  it("uses every catalog key in a mutation, or names the hook that records it", () => {
    const used = new Set(mutations.flatMap(({ def }) => def.meta?.audit ?? []));

    // Events recorded next to a declared one by the same mutation.
    const companions = new Set([
      "project.member_added",
      "project.member_removed",
      "assignment.created",
      "assignment.removed",
    ]);

    for (const entry of auditCatalog) {
      if (entry.hookOnly) {
        expect(used.has(entry.key), `${entry.key} is hook-only`).toBe(false);

        continue;
      }

      expect(
        used.has(entry.key) || companions.has(entry.key),
        `${entry.key} is recorded by no mutation and names no hook`,
      ).toBe(true);
    }
  });

  it("does not declare queries as audited", () => {
    for (const { path, def } of procedures) {
      if (def.type === "query") {
        expect(def.meta?.audit, path).toBeUndefined();
      }
    }
  });
});
