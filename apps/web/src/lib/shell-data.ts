import { listModules, type ModuleNavLink } from "@zentro/modules";

import type { ShellModule } from "~/src/components/shell/app-sidebar";

type Reachable = Record<string, boolean>;

const order = ["dashboard", "projects", "tasks", "docs", "settings"];

/**
 * What the sidebar and the page-level navigation show, from the module
 * manifests: one top-level entry per module the user can reach, and each
 * module's sub-pages for its own pages. Permission and module gating is the
 * same as it has always been.
 */
export function buildShell(enabledModules: string[], reachable: Reachable) {
  const enabled = new Set(enabledModules);
  const allowed = (link: { permission?: string }) =>
    !link.permission || (reachable[link.permission] ?? false);
  const modules: ShellModule[] = [];
  const moduleNav: Record<string, ModuleNavLink[]> = {};

  for (const manifest of listModules()) {
    if (!enabled.has(manifest.id)) continue;

    const items = manifest.nav.flatMap((section) => section.items);

    if (manifest.id === "settings") {
      // Every settings page is one entry; the settings layout lists the pages.
      const first = items.find(allowed);

      if (first) {
        modules.push({
          id: "settings",
          label: "Settings",
          href: first.href,
          icon: "Settings",
          base: manifest.basePath,
        });
      }

      continue;
    }

    for (const item of items) {
      if (!allowed(item)) continue;

      modules.push({
        id: manifest.id,
        label: item.label,
        href: item.href,
        icon: item.icon,
        base: manifest.basePath,
      });
      moduleNav[manifest.id] = (item.children ?? []).filter(allowed);
    }
  }

  modules.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));

  return { modules, moduleNav };
}
