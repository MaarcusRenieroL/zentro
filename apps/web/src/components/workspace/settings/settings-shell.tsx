"use client";

import { paths } from "~/src/lib/paths";
import { cn } from "@zentro/ui";
import {
  AlertTriangleIcon,
  BlocksIcon,
  Building2Icon,
  MailIcon,
  SettingsIcon,
  KeyRoundIcon,
  ScrollTextIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FC, ReactNode } from "react";

import { usePermissionMap } from "~/src/components/permissions/permission-provider";

const settingsNavItems: Array<{
  href: string;
  label: string;
  icon: typeof SettingsIcon;
  permission: string;
  matchPrefix?: boolean;
}> = [
  {
    href: paths.generalSettings(),
    label: "General",
    icon: SettingsIcon,
    permission: "org.settings.update",
  },
  {
    href: paths.membersSettings(),
    label: "Members",
    icon: UsersIcon,
    permission: "members.view",
  },
  {
    href: paths.teamsSettings(),
    label: "Teams",
    icon: ShieldCheckIcon,
    permission: "teams.view",
  },
  {
    href: paths.invitationsSettings(),
    label: "Invitations",
    icon: MailIcon,
    permission: "invitations.view",
  },
  {
    href: paths.rolesSettings(),
    label: "Roles & permissions",
    icon: KeyRoundIcon,
    permission: "roles.view",
    // The roles area has its own pages below this path.
    matchPrefix: true,
  },
  {
    href: paths.modulesSettings(),
    label: "Modules",
    icon: BlocksIcon,
    permission: "modules.view",
  },
  {
    href: paths.auditLogSettings(),
    label: "Audit log",
    icon: ScrollTextIcon,
    permission: "audit_logs.view",
  },
  {
    href: paths.dangerSettings(),
    label: "Danger Zone",
    icon: AlertTriangleIcon,
    permission: "org.delete",
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

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

export const SettingsShell: FC<Props> = ({ children, organization }) => {
  const pathname = usePathname();
  const permissions = usePermissionMap();

  return (
    <section className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 sm:gap-8">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          {organization.logo ? (
            <div
              aria-label={`${organization.name} logo`}
              className="size-12 shrink-0 rounded-md border bg-cover bg-center shadow-sm sm:size-14"
              role="img"
              style={{ backgroundImage: `url(${organization.logo})` }}
            />
          ) : (
            <div className="flex size-12 shrink-0 items-center justify-center rounded-md border bg-card text-base font-semibold text-foreground shadow-sm sm:size-14 sm:text-lg">
              {getInitials(organization.name) || (
                <Building2Icon className="size-6" />
              )}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight sm:text-3xl">
              Organization settings
            </h1>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {organization.name}
            </p>
          </div>
        </div>

        <div className="-mx-4 overflow-x-auto border-b px-4 sm:mx-0 sm:px-0">
          <nav className="flex min-w-max gap-4 sm:gap-6">
            {settingsNavItems
              .filter((item) => permissions[item.permission])
              .map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.matchPrefix && pathname.startsWith(`${item.href}/`)) ||
                  (item.href === paths.generalSettings() &&
                    (pathname === paths.settings() ||
                      pathname === paths.organizationSettings()));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-medium transition-colors",
                      isActive
                        ? "border-primary text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <item.icon className="size-4" />
                    {item.label}
                  </Link>
                );
              })}
          </nav>
        </div>

        <div className="w-full">{children}</div>
      </div>
    </section>
  );
};
