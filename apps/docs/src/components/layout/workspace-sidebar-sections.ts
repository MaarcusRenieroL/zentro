import {
  zentroWorkspaceSidebarSections,
  type WorkspaceSidebarSection,
} from "@zentro/ui/components/workspace-sidebar";
import { getOrgAppUrl } from "@zentro/utils";

type CreateWorkspaceSidebarSectionsInput = {
  orgSlug: string;
};

const appByPath: Record<string, "workspace" | "tasks" | "docs"> = {
  "/dashboard": "workspace",
  "/inbox": "workspace",
  "/notifications": "workspace",
  "/projects": "workspace",
  "/tasks": "tasks",
  "/calendar": "tasks",
  "/docs": "docs",
  "/settings": "workspace",
};

function getAppForHref(href: string) {
  const pathname = href.split("?")[0] ?? href;
  const pathKey = Object.keys(appByPath)
    .sort((a, b) => b.length - a.length)
    .find((key) => pathname === key || pathname.startsWith(`${key}/`));

  return pathKey ? (appByPath[pathKey] ?? "workspace") : "workspace";
}

function resolveHref(orgSlug: string, href: string) {
  return getOrgAppUrl({
    orgSlug,
    app: getAppForHref(href),
    path: href,
  });
}

export function createWorkspaceSidebarSections({
  orgSlug,
}: CreateWorkspaceSidebarSectionsInput): WorkspaceSidebarSection[] {
  return zentroWorkspaceSidebarSections.map((section) => ({
    ...section,
    items: section.items.map((item) => ({
      ...item,
      href: resolveHref(orgSlug, item.href),
      children: item.children?.map((child) => ({
        ...child,
        href: resolveHref(orgSlug, child.href),
      })),
    })),
  }));
}
