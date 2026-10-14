import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

// Colors come from tokens. This scan fails on raw Tailwind palette classes
// (bg-blue-500) and on hex, rgb, hsl or oklch literals outside the token
// layer. `baseline` lists files that still contain some, with the most they
// may contain: it can only shrink, and an entry that no longer offends fails
// the test so it gets removed.
const root = path.resolve(process.cwd(), "../..");
const roots = ["apps/web/src", "packages/ui/src"];
const tokenLayer = [
  "packages/ui/src/styles/globals.css",
  "packages/ui/src/lib/theme-colors.ts",
  "packages/ui/src/components/logo.tsx",
];

const palette =
  /\b(?:bg|text|border|ring|from|to|via|fill|stroke|divide|outline|shadow|accent|caret|decoration|placeholder)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white)(?:-\d{2,3})?(?:\/\d+)?\b/g;
const literal = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch)\(/g;

const baseline: Record<string, number> = {};

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    if (["node_modules", ".next", "dist"].includes(name)) return [];

    const full = path.join(dir, name);

    return statSync(full).isDirectory()
      ? files(full)
      : /\.(tsx|ts|css)$/.test(name)
        ? [full]
        : [];
  });
}

const found = new Map<string, number>();

for (const base of roots) {
  for (const file of files(path.join(root, base))) {
    const relative = path.relative(root, file);

    if (tokenLayer.includes(relative)) continue;

    const text = readFileSync(file, "utf8");
    const count =
      (text.match(palette)?.length ?? 0) + (text.match(literal)?.length ?? 0);

    if (count) found.set(relative, count);
  }
}

describe("no raw colors outside the token layer", () => {
  it("finds the source tree", () => {
    expect(files(path.join(root, "apps/web/src")).length).toBeGreaterThan(50);
  });

  it("does not add raw colors, and never exceeds the baseline", () => {
    for (const [file, count] of found) {
      expect(count, `${file} has raw colors`).toBeLessThanOrEqual(
        baseline[file] ?? 0,
      );
    }
  });

  it("keeps the baseline honest", () => {
    for (const file of Object.keys(baseline)) {
      expect(
        found.has(file),
        `${file} is clean now: remove it from the baseline`,
      ).toBe(true);
    }
  });
});
