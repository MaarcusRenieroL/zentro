import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { buildNavSections, listModules } from "../src";

const modules = listModules();
const ids = modules.map((manifest) => manifest.id);

describe("manifest sanity", () => {
  it("has unique ids", () => {
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("only depends on registered modules", () => {
    for (const manifest of modules) {
      for (const dependency of manifest.dependsOn) {
        expect(ids, `${manifest.id} -> ${dependency}`).toContain(dependency);
      }
    }
  });

  it("has no dependency cycles", () => {
    const visiting = new Set<string>();
    const done = new Set<string>();

    const visit = (id: string, trail: string[]) => {
      expect(visiting.has(id), `cycle: ${[...trail, id].join(" -> ")}`).toBe(
        false,
      );

      if (done.has(id)) {
        return;
      }

      visiting.add(id);

      for (const dependency of modules.find((item) => item.id === id)!
        .dependsOn) {
        visit(dependency, [...trail, id]);
      }

      visiting.delete(id);
      done.add(id);
    };

    ids.forEach((id) => visit(id, []));
  });

  it("keeps core modules always on", () => {
    for (const manifest of modules.filter((item) => item.core)) {
      expect(manifest.defaultEnabled, manifest.id).toBe(true);
      expect(manifest.dependsOn, manifest.id).toEqual([]);
    }
  });

  it("does not let a core module depend on a toggleable one", () => {
    const coreIds = modules.filter((item) => item.core).map((item) => item.id);

    for (const manifest of modules.filter((item) => item.core)) {
      for (const dependency of manifest.dependsOn) {
        expect(coreIds).toContain(dependency);
      }
    }
  });

  it("builds nav from enabled modules only and sorts sections", () => {
    const all = buildNavSections(new Set(ids));
    const withoutTasks = buildNavSections(
      new Set(ids.filter((id) => id !== "tasks")),
    );

    expect(all.map((section) => section.id)).toEqual([
      "workspace",
      "work",
      "organization",
      "settings",
    ]);

    const labels = (sections: typeof all) =>
      sections.flatMap((section) => section.items.map((item) => item.label));

    expect(labels(all)).toContain("Tasks");
    expect(labels(withoutTasks)).not.toContain("Tasks");
  });
});

// Reads the real route folders so a renamed route fails this test.
const appDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../apps/web/src/app",
);

function collectRoutes(dir: string, segments: string[] = []): string[][] {
  const routes: string[][] = [];

  if (existsSync(path.join(dir, "page.tsx"))) {
    routes.push(segments);
  }

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }

    // Route groups like "(workspace)" are not part of the URL.
    const isGroup = /^\(.+\)$/.test(entry.name);

    routes.push(
      ...collectRoutes(
        path.join(dir, entry.name),
        isGroup ? segments : [...segments, entry.name],
      ),
    );
  }

  return routes;
}

function routeExists(routes: string[][], href: string) {
  const parts = href.split("?")[0]!.split("/").filter(Boolean);

  return routes.some(
    (route) =>
      route.length === parts.length &&
      route.every(
        (segment, index) =>
          /^\[.+\]$/.test(segment) || segment === parts[index],
      ),
  );
}

describe("manifest routes exist in apps/web", () => {
  const routes = collectRoutes(appDir);

  it("finds the app routes", () => {
    expect(routes.length).toBeGreaterThan(10);
  });

  it("has a page for every basePath", () => {
    for (const manifest of modules) {
      expect(
        routeExists(routes, manifest.basePath),
        `${manifest.id}: ${manifest.basePath}`,
      ).toBe(true);
    }
  });

  // Items marked `disabled` are "Soon" placeholders without a route yet.
  it("has a page for every enabled nav link", () => {
    for (const manifest of modules) {
      for (const section of manifest.nav) {
        for (const item of section.items) {
          for (const link of [item, ...(item.children ?? [])]) {
            if (link.disabled) {
              continue;
            }

            expect(
              routeExists(routes, link.href),
              `${manifest.id}: ${link.label} -> ${link.href}`,
            ).toBe(true);
          }
        }
      }
    }
  });
});
