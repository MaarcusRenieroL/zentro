import { listModules, type ModuleNavLink } from "@zentro/modules";

import type { ShellModule } from "~/src/components/shell/app-sidebar";
import { paths } from "~/src/lib/paths";

type Reachable = Record<string, boolean>;

const order = [
  "dashboard",
  "tasks",
  "projects",
  "docs",
  "team",
  "overview",
  "settings",
];

/**
 * What the sidebar and the page-level navigation show, from the module
 * manifests: one top-level entry per module the user can reach, and each
 * module's sub-pages for its own pages. Permission and module gating is the
 * same as it has always been.
 */
export function buildShell(
  enabledModules: string[],
  reachable: Reachable,
  options: { overview?: boolean } = {},
) {
  const enabled = new Set(enabledModules);
  const allowed = (link: { permission?: string }) =>
    !link.permission || (reachable[link.permission] ?? false);
  const modules: ShellModule[] = [];
  const teamHref = "/settings/organization/members";
  const moduleNav: Record<string, ModuleNavLink[]> = {};

  for (const manifest of listModules()) {
    if (!enabled.has(manifest.id)) continue;

    const items = manifest.nav.flatMap((section) => section.items);

    if (manifest.id === "settings") {
      // Every settings page is one entry; the settings layout lists the pages.
      const first =
        items.find((item) => allowed(item) && item.href !== teamHref) ??
        items.find(allowed);

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
        // The dashboard is the Today screen.
        label: manifest.id === "dashboard" ? "Today" : item.label,
        href: item.href,
        icon: item.icon,
        base: manifest.basePath,
      });
      moduleNav[manifest.id] = (item.children ?? []).filter(allowed);
    }
  }

  // People live under settings, but they are a first-class place to go.
  if (enabled.has("settings") && reachable["members.view"]) {
    modules.push({
      id: "team",
      label: "Team",
      href: teamHref,
      icon: "Users",
      base: teamHref,
      bases: [paths.invitationsSettings(), paths.teamsSettings()],
    });
  }

  if (options.overview) {
    modules.push({
      id: "overview",
      label: "Overview",
      href: "/overview",
      icon: "Gauge",
      base: "/overview",
      bases: [
        paths.rolesSettings(),
        paths.modulesSettings(),
        paths.auditLogSettings(),
      ],
    });
  }

  modules.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));

  return { modules, moduleNav };
}
