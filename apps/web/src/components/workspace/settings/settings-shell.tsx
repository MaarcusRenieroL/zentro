"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FC, ReactNode } from "react";
import { ArrowUpRightIcon } from "lucide-react";

import { cn } from "@zentro/ui/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zentro/ui/shadcn/select";

import { usePermissionMap } from "~/src/components/permissions/permission-provider";
import { paths } from "~/src/lib/paths";

import { AdminFrame, adminPaths, inArea, TeamFrame, teamPaths } from "./frames";

type Item = {
  href: string;
  label: string;
  /** Leave out for pages everyone can open (your own account). */
  permission?: string;
  /** Opens a page in another area (Team or Overview). */
  external?: boolean;
};

// Settings are grouped by what they are for. Members, Roles and Modules live
// in the Team and Overview areas now, so the rail links out to them (↗).
const groups: Array<{ label: string; items: Item[] }> = [
  {
    label: "Account",
    items: [
      { href: "/settings/account/profile", label: "Profile" },
      { href: "/settings/account/appearance", label: "Appearance" },
    ],
  },
  {
    label: "Organization",
    items: [
      {
        href: paths.generalSettings(),
        label: "General",
        permission: "org.settings.update",
      },
      {
        href: paths.modulesSettings(),
        label: "Modules",
        permission: "modules.view",
        external: true,
      },
    ],
  },
  {
    label: "Access",
    items: [
      {
        href: paths.membersSettings(),
        label: "Members",
        permission: "members.view",
        external: true,
      },
      {
        href: paths.rolesSettings(),
        label: "Roles & access",
        permission: "roles.view",
        external: true,
      },
    ],
  },
  {
    label: "Security",
    items: [
      { href: "/settings/account/security", label: "Password & sessions" },
    ],
  },
  {
    label: "Danger zone",
    items: [
      {
        href: paths.dangerSettings(),
        label: "Delete or transfer",
        permission: "org.delete",
      },
    ],
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

  return <SettingsRail>{children}</SettingsRail>;
};

const SettingsRail: FC<{ children: ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const permissions = usePermissionMap();

  const visible = groups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !item.permission || permissions[item.permission],
      ),
    }))
    .filter((group) => group.items.length);
  const all = visible.flatMap((group) => group.items);
  const isActive = (item: Item) =>
    pathname === item.href ||
    (item.href === paths.generalSettings() &&
      (pathname === paths.settings() ||
        pathname === paths.organizationSettings()));
  const active = all.find(isActive);

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
      <div className="flex flex-col gap-4 lg:gap-6">
        <h1 className="font-display text-[length:var(--title-size)] leading-[1.1]">
          Settings
        </h1>

        {/* Below 1024px the pages are one compact menu. */}
        <div className="lg:hidden">
          <Select
            value={active?.href ?? ""}
            onValueChange={(href) => router.push(href)}
          >
            <SelectTrigger className="w-full" aria-label="Settings page">
              <SelectValue placeholder="Settings" />
            </SelectTrigger>
            <SelectContent>
              {visible.map((group) =>
                group.items.map((item) => (
                  <SelectItem key={item.href} value={item.href}>
                    {group.label === item.label
                      ? item.label
                      : `${group.label} · ${item.label}`}
                  </SelectItem>
                )),
              )}
            </SelectContent>
          </Select>
        </div>

        <nav aria-label="Settings" className="hidden flex-col gap-5 lg:flex">
          {visible.map((group) => (
            <div key={group.label} className="flex flex-col gap-0.5">
              <span
                className={cn(
                  "eyebrow px-2.5 pb-1.5",
                  group.label === "Danger zone" && "text-danger-text",
                )}
              >
                {group.label}
              </span>
              {group.items.map((item) => {
                const current = active?.href === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={current ? "page" : undefined}
                    className={cn(
                      "flex h-[34px] items-center rounded-[10px] px-2.5 text-sm text-ink-2 outline-none hover:bg-hover hover:text-ink focus-visible:ring-2 focus-visible:ring-ring",
                      current &&
                        "bg-hover font-medium text-ink shadow-[inset_0_0_0_1px_var(--hairline)]",
                    )}
                  >
                    {item.label}
                    {item.external ? (
                      <ArrowUpRightIcon
                        aria-hidden="true"
                        className="ml-auto size-3.5 text-ink-3"
                      />
                    ) : null}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      <div className="max-w-[780px] min-w-0">{children}</div>
    </div>
  );
};
