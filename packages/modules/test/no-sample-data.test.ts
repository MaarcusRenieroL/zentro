import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

// A plain grep over the source tree: the UI must not import sample data, and
// the sample strings that used to be hardcoded must not come back.
const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const scanned = ["apps/web/src", "packages/ui/src"].map((dir) =>
  path.join(root, dir),
);

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);

    if (statSync(full).isDirectory()) {
      return listSourceFiles(full);
    }

    return /\.(ts|tsx)$/.test(name) ? [full] : [];
  });
}

const files = scanned.flatMap(listSourceFiles).map((file) => ({
  file: path.relative(root, file),
  source: readFileSync(file, "utf8"),
}));

const sampleLocation =
  /(^|[\\/])(mock|mocks|sample|samples|fixture|fixtures|__mocks__)([\\/]|$)/i;

describe("no sample data in the UI", () => {
  it("scans the source tree", () => {
    expect(files.length).toBeGreaterThan(100);
  });

  it("has no data.ts or constants.ts inside a mock, sample or fixtures folder", () => {
    const offenders = files
      .map(({ file }) => file)
      .filter(
        (file) =>
          sampleLocation.test(path.dirname(file)) &&
          /(^|[\\/])(data|constants)\.tsx?$/.test(file),
      );

    expect(offenders).toEqual([]);
  });

  it("imports nothing from a data or constants module in a mock, sample or fixtures location", () => {
    const importPattern = /from\s+["']([^"']+)["']/g;
    const offenders: string[] = [];

    for (const { file, source } of files) {
      for (const match of source.matchAll(importPattern)) {
        const specifier = match[1]!;
        const lastSegment = specifier
          .split("/")
          .at(-1)!
          .replace(/\.tsx?$/, "");

        if (
          (lastSegment === "data" || lastSegment === "constants") &&
          sampleLocation.test(specifier)
        ) {
          offenders.push(`${file}: ${specifier}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it("does not bring back removed sample data or hardcoded placeholders", () => {
    const banned = [
      "workspaceTasks",
      "workLogEvents",
      "workTypeSummary",
      "sampleTasks",
      "Maarcus",
      "Sprint 0",
      "June 2026",
      "cdn.shadcnstudio.com",
      "Connect task filters to mock state",
      "0 events today",
      "0 mentions",
    ];
    const offenders: string[] = [];

    for (const { file, source } of files) {
      for (const word of banned) {
        if (source.includes(word)) {
          offenders.push(`${file}: ${word}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});
