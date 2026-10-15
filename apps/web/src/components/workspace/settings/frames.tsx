"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { DownloadIcon, PlusIcon } from "lucide-react";

import { useTrpcClient } from "@zentro/api/react";
import { cn } from "@zentro/ui/lib/utils";
import { Button } from "@zentro/ui/shadcn/button";

import {
  useBaseRole,
  usePermissionMap,
} from "~/src/components/permissions/permission-provider";
import { paths } from "~/src/lib/paths";

/**
 * Inside a Team or Overview frame the frame owns the page title, so a
 * section's own settings header steps aside.
 */
export const FramedContext = createContext(false);

export const useFramed = () => useContext(FramedContext);

type FrameAction = {
  label: string;
  onClick: () => void;
  /** "outline" with a download icon for secondary actions like exports. */
  kind?: "create" | "export";
} | null;

const FrameActionContext = createContext<(action: FrameAction) => void>(
  () => undefined,
);

/**
 * Puts a page's main action ("New role") in the frame's header, next to the
 * title. Outside a frame it does nothing and returns false, so the page shows
 * its own button.
 */
export function useFrameAction(
  label: string | null,
  onClick: () => void,
  kind: "create" | "export" = "create",
) {
  const framed = useFramed();
  const set = useContext(FrameActionContext);
  const latest = useRef(onClick);

  useEffect(() => {
    latest.current = onClick;
  });

  useEffect(() => {
    if (!framed || !label) return;

    set({ label, kind, onClick: () => latest.current() });

    return () => set(null);
  }, [framed, label, kind, set]);

  return framed && Boolean(label);
}

function FrameActionButton({ action }: { action: FrameAction }) {
  if (!action) return null;

  if (action.kind === "export") {
    return (
      <Button variant="outline" onClick={action.onClick}>
        <DownloadIcon />
        {action.label}
      </Button>
    );
  }

  return (
    <Button className="h-10 px-3.5 font-semibold" onClick={action.onClick}>
      <PlusIcon />
      {action.label}
    </Button>
  );
}

/** Pages that read as the Team area rather than as settings. */
export const teamPaths = [
  paths.membersSettings(),
  paths.invitationsSettings(),
  paths.teamsSettings(),
];

/** Pages that read as the admin Overview area. */
export const adminPaths = [
  paths.rolesSettings(),
  paths.modulesSettings(),
  paths.auditLogSettings(),
];

export function inArea(pathname: string, area: string[]) {
  return area.some(
    (href) => pathname === href || pathname.startsWith(`${href}/`),
  );
}

type Tab = { href: string; label: string; count?: number; prefix?: boolean };

/** Underline tabs that link to pages, with optional mono counts. */
export function FrameTabs({ tabs, label }: { tabs: Tab[]; label: string }) {
  const pathname = usePathname();

  return (
    <nav
      data-slot="section-nav"
      aria-label={label}
      className="hide-scrollbar flex gap-5 overflow-x-auto border-b border-hairline text-[15px]"
    >
      {tabs.map((tab) => {
        const active =
          pathname === tab.href ||
          Boolean(tab.prefix && pathname.startsWith(`${tab.href}/`));

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px flex items-baseline gap-1.5 border-b-2 py-2.5 whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "border-ink font-medium text-ink"
                : "border-transparent text-ink-2 hover:text-ink",
            )}
          >
            {tab.label}
            {tab.count !== undefined ? (
              <span className="font-mono text-xs text-ink-3">{tab.count}</span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

/** Members, Invitations and Teams under one "Team" title. */
export function TeamFrame({ children }: { children: ReactNode }) {
  const trpc = useTrpcClient();
  const pathname = usePathname();
  const permissions = usePermissionMap();
  const [counts, setCounts] = useState<{
    members?: number;
    invitations?: number;
    teams?: number;
  }>({});

  useEffect(() => {
    let live = true;

    // Counts are a courtesy: a list the viewer cannot read just has none.
    Promise.all([
      permissions["members.view"]
        ? trpc.member.getMembers.query().catch(() => null)
        : null,
      permissions["invitations.view"]
        ? trpc.invitation.list.query().catch(() => null)
        : null,
      permissions["teams.view"]
        ? trpc.team.getAll.query().catch(() => null)
        : null,
    ]).then(([members, invitations, teams]) => {
      if (!live) return;

      setCounts({
        members: members?.length,
        invitations: invitations?.filter(
          (invitation) => invitation.status === "pending",
        ).length,
        teams: teams?.length,
      });
    });

    return () => {
      live = false;
    };
  }, [trpc, permissions, pathname]);

  const tabs: Tab[] = [
    permissions["members.view"]
      ? {
          href: paths.membersSettings(),
          label: "Members",
          count: counts.members,
        }
      : null,
    permissions["invitations.view"]
      ? {
          href: paths.invitationsSettings(),
          label: "Invitations",
          count: counts.invitations,
        }
      : null,
    permissions["teams.view"]
      ? { href: paths.teamsSettings(), label: "Teams", count: counts.teams }
      : null,
  ].filter((tab) => tab !== null);
  const onTeams = pathname === paths.teamsSettings();
  const action = onTeams
    ? permissions["teams.create"]
      ? { href: `${paths.teamsSettings()}?new=1`, label: "New team" }
      : null
    : permissions["members.invite"] && pathname !== paths.invitationsSettings()
      ? { href: paths.invitationsSettings(), label: "Invite people" }
      : null;

  // A team's own page has its own header.
  if (pathname.startsWith(`${paths.teamsSettings()}/`)) {
    return <FramedContext.Provider value>{children}</FramedContext.Provider>;
  }

  return (
    <FramedContext.Provider value>
      <div className="flex w-full flex-col">
        <div className="flex min-h-10 flex-wrap items-center gap-3">
          <h1 className="font-display text-[1.75rem] leading-8 sm:text-[length:var(--title-size)] sm:leading-9">
            Team
          </h1>
          <span className="flex-1" />
          {action ? (
            <Button asChild className="h-10 px-3.5 font-semibold">
              <Link href={action.href}>
                <PlusIcon />
                {action.label}
              </Link>
            </Button>
          ) : null}
        </div>
        <div className="mt-4">
          <FrameTabs tabs={tabs} label="Team" />
        </div>
        <div className="mt-5 min-w-0">{children}</div>
      </div>
    </FramedContext.Provider>
  );
}

/** The admin area tabs: Overview, Roles & access, Modules, Audit log. */
export function AdminTabs() {
  const permissions = usePermissionMap();
  const baseRole = useBaseRole();
  const admin = baseRole === "owner" || baseRole === "admin";
  const tabs: Tab[] = [
    admin ? { href: paths.overview(), label: "Overview" } : null,
    permissions["roles.view"]
      ? { href: paths.rolesSettings(), label: "Roles & access", prefix: true }
      : null,
    permissions["modules.view"]
      ? { href: paths.modulesSettings(), label: "Modules" }
      : null,
    permissions["audit_logs.view"]
      ? { href: paths.auditLogSettings(), label: "Audit log" }
      : null,
  ].filter((tab) => tab !== null);

  return <FrameTabs tabs={tabs} label="Administration" />;
}

const adminTitles: Array<[string, string]> = [
  [paths.rolesSettings(), "Roles & access"],
  [paths.modulesSettings(), "Modules"],
  [paths.auditLogSettings(), "Audit log"],
];

const roleTabs: Tab[] = [
  { href: paths.rolesSettings(), label: "Roles" },
  { href: paths.rolesAssignments(), label: "Assignments" },
  { href: paths.accessCheck(), label: "Access check" },
  { href: paths.permissionLog(), label: "Permission log" },
];

/** The roles area's own pages as a small segmented nav. */
function RoleTabs() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Roles and access"
      className="flex w-fit max-w-full gap-0.5 overflow-x-auto rounded-md border border-hairline bg-surface p-1"
    >
      {roleTabs.map((tab) => {
        const active = pathname === tab.href;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-sm px-3 py-1.5 text-sm whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-ink font-medium text-ink-inverse"
                : "text-ink-2 hover:bg-hover hover:text-ink",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Roles, Modules and the Audit log, titled as part of Overview. */
export function AdminFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [action, setAction] = useState<FrameAction>(null);
  const title =
    adminTitles.find(([href]) => inArea(pathname, [href]))?.[1] ?? "Overview";
  const onRolePage = roleTabs.some((tab) => tab.href === pathname);

  return (
    <FramedContext.Provider value>
      <FrameActionContext.Provider value={setAction}>
        <div className="flex w-full flex-col">
          <div className="flex min-h-10 flex-wrap items-center gap-3">
            <h1 className="font-display text-[1.75rem] leading-8 sm:text-[length:var(--title-size)] sm:leading-9">
              {title}
            </h1>
            <span className="rounded-sm border border-hairline px-1.5 py-px font-mono text-[10px] tracking-[0.06em] text-ink-3 uppercase">
              Owners and admins
            </span>
            <span className="flex-1" />
            <FrameActionButton action={action} />
          </div>
          <div className="mt-4">
            <AdminTabs />
          </div>
          {onRolePage ? (
            <div className="mt-4">
              <RoleTabs />
            </div>
          ) : null}
          <div className="mt-5 min-w-0">{children}</div>
        </div>
      </FrameActionContext.Provider>
    </FramedContext.Provider>
  );
}

/** Renders its children only outside a Team or Overview frame. */
export function HideWhenFramed({
  children,
  fallback = null,
}: {
  children: ReactNode;
  /** What shows instead inside a frame. */
  fallback?: ReactNode;
}) {
  return useFramed() ? fallback : children;
}
