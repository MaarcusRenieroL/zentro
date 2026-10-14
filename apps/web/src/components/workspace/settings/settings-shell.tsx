"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FC, ReactNode } from "react";

import { OrgAvatar } from "@zentro/ui/components/org-avatar";
import { PageHeader } from "@zentro/ui/components/page-header";
import { SectionNav } from "@zentro/ui/components/section-nav";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zentro/ui/shadcn/select";

import { usePermissionMap } from "~/src/components/permissions/permission-provider";
import { paths } from "~/src/lib/paths";

type Item = {
  href: string;
  label: string;
  permission: string;
  matchPrefix?: boolean;
};

// Settings are grouped by what they are for. The permission of each page is
// the same as it has always been.
const groups: Array<{ label: string; items: Item[] }> = [
  {
    label: "Organization",
    items: [
      {
        href: paths.generalSettings(),
        label: "General",
        permission: "org.settings.update",
      },
      {
        href: paths.membersSettings(),
        label: "Members",
        permission: "members.view",
      },
      {
        href: paths.invitationsSettings(),
        label: "Invitations",
        permission: "invitations.view",
      },
      { href: paths.teamsSettings(), label: "Teams", permission: "teams.view" },
    ],
  },
  {
    label: "Access",
    items: [
      {
        href: paths.rolesSettings(),
        label: "Roles & permissions",
        permission: "roles.view",
        // The roles area has its own pages below this path.
        matchPrefix: true,
      },
      {
        href: paths.modulesSettings(),
        label: "Modules",
        permission: "modules.view",
      },
    ],
  },
  {
    label: "Security",
    items: [
      {
        href: paths.auditLogSettings(),
        label: "Audit log",
        permission: "audit_logs.view",
      },
    ],
  },
  {
    label: "Danger zone",
    items: [
      {
        href: paths.dangerSettings(),
        label: "Danger zone",
        permission: "org.delete",
      },
    ],
  },
];

type Props = {
  children: ReactNode;
  organization: {
    name: string;
    slug: string;
    logo?: string | null;
  };
};

export const SettingsShell: FC<Props> = ({ children, organization }) => {
  const pathname = usePathname();
  const router = useRouter();
  const permissions = usePermissionMap();

  const visible = groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => permissions[item.permission]),
    }))
    .filter((group) => group.items.length);
  const all = visible.flatMap((group) => group.items);
  const isActive = (item: Item) =>
    pathname === item.href ||
    (item.matchPrefix && pathname.startsWith(`${item.href}/`)) ||
    (item.href === paths.generalSettings() &&
      (pathname === paths.settings() ||
        pathname === paths.organizationSettings()));
  const active = all.find(isActive);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Settings"
        description={organization.name}
        meta={<OrgAvatar name={organization.name} seed={organization.slug} />}
      />

      <div className="grid gap-6 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-10">
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

        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-5 rounded-3xl bg-sunken p-3">
            {visible.map((group) => (
              <div key={group.label} className="space-y-1">
                {group.items.length > 1 ||
                group.label !== group.items[0]?.label ? (
                  <p className="px-2.5 pt-1 text-xs font-semibold tracking-wide text-ink-3 uppercase">
                    {group.label}
                  </p>
                ) : null}
                <SectionNav
                  orientation="vertical"
                  label={group.label}
                  LinkComponent={Link}
                  activeHref={active?.href ?? null}
                  items={group.items.map(({ href, label }) => ({
                    href,
                    label,
                  }))}
                />
              </div>
            ))}
          </div>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
};
