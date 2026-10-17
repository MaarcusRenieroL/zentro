"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FC, ReactNode } from "react";

import { cn } from "@zentro/ui/lib/utils";

import { usePermissionMap } from "~/src/components/permissions/permission-provider";
import { paths } from "~/src/lib/paths";

import {
  AdminFrame,
  adminPaths,
  FramedContext,
  inArea,
  TeamFrame,
  teamPaths,
} from "./frames";

type Item = {
  href: string;
  label: string;
  /** Leave out for pages everyone can open (your own account). */
  permission?: string;
};

const settingsTabs: Item[] = [
  {
    href: paths.generalSettings(),
    label: "General",
    permission: "org.settings.update",
  },
  {
    href: paths.automationsSettings(),
    label: "Automations",
    permission: "tasks.view",
  },
  {
    href: "/settings/account/profile",
    label: "Profile",
  },
  {
    href: "/settings/account/appearance",
    label: "Appearance",
  },
  {
    href: "/settings/account/security",
    label: "Security",
  },
  {
    href: paths.dangerSettings(),
    label: "Danger zone",
    permission: "org.delete",
  },
];

type Props = {
  children: ReactNode;
  organization?: {
    name: string;
    slug: string;
    logo?: string | null;
  };
};

export const SettingsShell: FC<Props> = ({ children }) => {
  const pathname = usePathname();

  // Members, Invitations and Teams read as the Team area; Roles, Modules and
  // the Audit log as the admin Overview. Their URLs stay under /settings.
  if (inArea(pathname, teamPaths)) return <TeamFrame>{children}</TeamFrame>;
  if (inArea(pathname, adminPaths)) return <AdminFrame>{children}</AdminFrame>;

  return <SettingsNav>{children}</SettingsNav>;
};

const SettingsNav: FC<{ children: ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const permissions = usePermissionMap();

  const visibleTabs = settingsTabs.filter(
    (item) => !item.permission || permissions[item.permission],
  );

  const isActive = (item: Item) =>
    pathname === item.href ||
    (item.href === paths.generalSettings() &&
      (pathname === paths.settings() ||
        pathname === paths.organizationSettings()));

  return (
    <FramedContext.Provider value>
      <div className="flex w-full flex-col gap-6">
        <div className="flex flex-col gap-4 sm:gap-5">
          <h1 className="font-display text-[1.75rem] leading-8 sm:text-[length:var(--title-size)] sm:leading-9">
            Settings
          </h1>

          <nav
            aria-label="Settings sections"
            className="hide-scrollbar flex gap-5 overflow-x-auto border-b border-hairline text-[15px]"
          >
            {visibleTabs.map((item) => {
              const active = isActive(item);
              const isDanger = item.label === "Danger zone";

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "-mb-px flex items-center gap-1.5 border-b-2 py-2.5 whitespace-nowrap outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? isDanger
                        ? "border-danger font-medium text-danger-text"
                        : "border-signal font-medium text-ink"
                      : "border-transparent text-ink-2 hover:border-hairline hover:text-ink",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="max-w-[780px] min-w-0">{children}</div>
      </div>
    </FramedContext.Provider>
  );
};
