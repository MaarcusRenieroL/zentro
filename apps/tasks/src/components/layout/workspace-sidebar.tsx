"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  createWorkspaceSidebarSections,
  WorkspaceSidebar as BaseWorkspaceSidebar,
} from "@zentro/ui/components/workspace-sidebar";
import { getOrgAppUrl } from "@zentro/utils";

type Props = {
  orgSlug: string;
};

export const WorkspaceSidebar = ({ orgSlug }: Props) => {
  const pathname = usePathname();

  return (
    <BaseWorkspaceSidebar
      pathname={pathname}
      LinkComponent={Link}
      sections={createWorkspaceSidebarSections({ orgSlug, getOrgAppUrl })}
    />
  );
};
