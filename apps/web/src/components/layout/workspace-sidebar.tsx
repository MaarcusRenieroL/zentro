"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { ModuleNavLink, ModuleNavSection } from "@zentro/modules";
import {
  WorkspaceSidebar as BaseWorkspaceSidebar,
  type WorkspaceSidebarSection,
} from "@zentro/ui/components/workspace-sidebar";

import { getModuleIcon } from "~/src/lib/module-icons";

// `/docs` is the "All docs" index; every other docs route is a sibling item,
// so it must only match exactly instead of as a path prefix.
function isActivePath(pathname: string, href: string) {
  const basePath = new URL(href, "http://zentro.local").pathname;

  if (basePath === "/docs") {
    return pathname === basePath;
  }

  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}

function toLink(link: ModuleNavLink) {
  return { ...link, icon: getModuleIcon(link.icon) };
}

function toSidebarSections(
  sections: ModuleNavSection[],
): WorkspaceSidebarSection[] {
  return sections.map((section) => ({
    label: section.label,
    items: section.items.map((item) => ({
      ...toLink(item),
      children: item.children?.map(toLink),
    })),
  }));
}

type Props = {
  sections: ModuleNavSection[];
};

export const WorkspaceSidebar = ({ sections }: Props) => {
  const pathname = usePathname();

  return (
    <BaseWorkspaceSidebar
      pathname={pathname}
      LinkComponent={Link}
      isActivePath={isActivePath}
      sections={toSidebarSections(sections)}
    />
  );
};
