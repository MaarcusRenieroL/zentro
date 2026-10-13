"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { WorkspaceSidebar as BaseWorkspaceSidebar } from "@zentro/ui/components/workspace-sidebar";

// `/docs` is the "All docs" index; every other docs route is a sibling item,
// so it must only match exactly instead of as a path prefix.
function isActivePath(pathname: string, href: string) {
  const basePath = new URL(href, "http://zentro.local").pathname;

  if (basePath === "/docs") {
    return pathname === basePath;
  }

  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}

export const WorkspaceSidebar = () => {
  const pathname = usePathname();

  return (
    <BaseWorkspaceSidebar
      pathname={pathname}
      LinkComponent={Link}
      isActivePath={isActivePath}
    />
  );
};
