import type { BreadcrumbEntry } from "@zentro/ui/components/breadcrumbs";

type Crumb = { label: string; mono?: boolean };

const labels: Record<string, string> = {
  dashboard: "Today",
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
  roles: "Roles & permissions",
  assignments: "Assignments",
  log: "Permission log",
  "access-check": "Access check",
  "audit-log": "Audit log",
  access: "Members & access",
  "module-disabled": "Module off",
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

  for (const [index, segment] of segments.entries()) {
    href += `/${segment}`;

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
