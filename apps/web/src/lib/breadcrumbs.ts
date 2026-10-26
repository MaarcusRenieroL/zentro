import type { BreadcrumbEntry } from "@zentro/ui/components/breadcrumbs";

type Crumb = { label: string; mono?: boolean };

const labels: Record<string, string> = {
  dashboard: "Today",
  inbox: "Notifications",
  files: "Files",
  calendar: "Calendar",
  mail: "Mail",
  whiteboards: "Whiteboards",
  chat: "Chat",
  projects: "Projects",
  tasks: "Tasks",
  docs: "Docs",
  settings: "Settings",
  overview: "Overview",
  "my-docs": "My docs",
  recent: "Recent",
  search: "Search",
  trash: "Trash",
  general: "General",
  members: "Members",
  invitations: "Invitations",
  teams: "Teams",
  modules: "Modules",
  danger: "Danger zone",
  roles: "Roles & access",
  assignments: "Assignments",
  log: "Permission log",
  "access-check": "Access check",
  "audit-log": "Audit log",
  access: "Members & access",
  "module-disabled": "Module off",
  account: "Account",
  profile: "Profile",
  appearance: "Appearance",
  security: "Security",
  automations: "Automations",
};

const team = { label: "Team", href: "/settings/organization/members" };
// Admin pages stand on their own: "Northwind Labs / Roles & access".
const areas: Record<string, BreadcrumbEntry | null> = {
  members: team,
  invitations: team,
  teams: team,
  roles: null,
  modules: null,
  "audit-log": null,
};

// Segments that are part of a route rather than a name.
const staticSegments = new Set(Object.keys(labels));

/**
 * The path to the current page with real names: a project's name, a task's
 * key, a doc's title. Names the page has not loaded yet show a skeleton.
 */
export function getBreadcrumbs(
  pathname: string,
  registered: Record<string, Crumb>,
): BreadcrumbEntry[] {
  const segments = pathname.split("/").filter(Boolean);
  const entries: BreadcrumbEntry[] = [];
  let href = "";

  // People and administration live under /settings/organization but read as
  // the Team and Overview areas.
  if (segments[0] === "settings" && segments[1] === "organization") {
    const area = areas[segments[2] ?? ""];

    if (area !== undefined) {
      if (area) entries.push(area);
      href = `/settings/organization`;

      for (const segment of segments.slice(2)) {
        href += `/${segment}`;

        const label = labels[segment];
        const named = registered[href];

        if (label) entries.push({ label, href });
        else if (named) entries.push({ ...named, href });
        else entries.push({ label: segment, href, loading: true });
      }

      return entries;
    }
  }

  for (const [index, segment] of segments.entries()) {
    href += `/${segment}`;

    // "account" is only a path prefix: "Settings / Profile".
    if (segment === "account" && segments[0] === "settings") continue;

    // "organization" is only a path prefix for settings pages.
    if (segment === "organization" && segments[0] === "settings") {
      href = "/settings/organization";
      continue;
    }

    if (staticSegments.has(segment)) {
      // "projects" inside docs is the project docs page; inside settings of a
      // project, "settings" is the project's own settings.
      entries.push({
        label:
          segments[index - 1] === "projects" && segment === "settings"
            ? "Settings"
            : (labels[segment] ?? segment),
        href:
          segment === "settings" && segments[0] === "settings"
            ? "/settings/organization/general"
            : href,
      });
      continue;
    }

    const registeredCrumb = registered[href];

    if (registeredCrumb) {
      entries.push({ ...registeredCrumb, href });
    } else if (segments[index - 1] === "tasks") {
      // A task's key is in the URL already.
      entries.push({ label: decodeURIComponent(segment), mono: true, href });
    } else {
      entries.push({ label: segment, href, loading: true });
    }
  }

  return entries.length ? entries : [{ label: "Today", href: "/dashboard" }];
}
