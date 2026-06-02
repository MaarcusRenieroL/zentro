"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { WorkspaceSidebar as BaseWorkspaceSidebar } from "@zentro/ui/components/workspace-sidebar";

import { createWorkspaceSidebarSections } from "./workspace-sidebar-sections";

type Props = {
  orgSlug: string;
};

export const WorkspaceSidebar = ({ orgSlug }: Props) => {
  const pathname = usePathname();

  return (
    <BaseWorkspaceSidebar
      pathname={pathname}
      LinkComponent={Link}
      sections={createWorkspaceSidebarSections({ orgSlug })}
    />
  );
};
