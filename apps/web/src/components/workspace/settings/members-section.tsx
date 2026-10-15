"use client";

import { useTrpcClient } from "@zentro/api/react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@zentro/ui/components/shadcn/alert-dialog";
import { Button } from "@zentro/ui/components/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@zentro/ui/components/shadcn/dropdown-menu";
import { Input } from "@zentro/ui/components/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zentro/ui/components/shadcn/select";
import { toastError, toastSuccess } from "@zentro/ui/index";
import { cn } from "@zentro/ui/lib/utils";
import {
  AlertCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
  SearchIcon,
  ShieldIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FC, useState } from "react";

import { ActorAvatar } from "~/src/components/actor-avatar";
import { MemberAccessDialog } from "~/src/components/workspace/roles/member-access-dialog";
import {
  useAnyPermission,
  usePermission,
} from "~/src/components/permissions/permission-provider";
import { paths } from "~/src/lib/paths";
import { trpcResult } from "~/src/lib/trpc-result";
import { Member } from "~/src/lib/types";

import { SettingsHeader } from "./settings-kit";

type Role = "owner" | "admin" | "member";

const PAGE_SIZE = 10;

const teamDots = [
  "bg-tint-tasks",
  "bg-tint-projects",
  "bg-tint-docs",
  "bg-tint-teams",
  "bg-tint-audit",
] as const;

function dotFor(name: string) {
  let hash = 0;

  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;

  return teamDots[hash % teamDots.length];
}

function formatRole(role: Role) {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

/** "Active now", "12m ago", "2h ago", "Yesterday" or a short date. */
export function shortAgo(iso: string | null) {
  if (!iso) return "Never";

  const at = new Date(iso);
  const minutes = Math.round((Date.now() - at.getTime()) / 60_000);

  if (minutes < 5) return "Active now";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 24 * 60) return `${Math.round(minutes / 60)}h ago`;
  if (minutes < 48 * 60) return "Yesterday";
  if (minutes < 7 * 24 * 60) return `${Math.round(minutes / 1440)}d ago`;

  return at.toLocaleDateString("en", { month: "short", day: "numeric" });
}

function monthYear(date: Date) {
  return new Date(date).toLocaleDateString("en", {
    month: "short",
    year: "numeric",
  });
}

/** A small bordered select used as a table filter. */
function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <Select
      value={value}
      onValueChange={(next) => {
        // Radix clears to "" while options mount.
        if (next !== "") onChange(next);
      }}
    >
      <SelectTrigger
        size="sm"
        aria-label={label}
        className="h-8 w-auto gap-1.5 rounded-md bg-surface px-2.5 text-[13px] data-[size=sm]:h-8"
      >
        {value === "all" ? label : <SelectValue />}
      </SelectTrigger>
      <SelectContent align="start">
        <SelectItem value="all">All</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

type RoleControlProps = {
  disabled: boolean;
  isCurrentUser: boolean;
  member: Member;
  onRoleChange: (memberId: string, role: Role) => void;
};

const pill =
  "inline-flex h-7 items-center gap-1 rounded-sm border border-hairline px-2.5 text-[13px]";

const RoleControl: FC<RoleControlProps> = ({
  disabled,
  isCurrentUser,
  member,
  onRoleChange,
}) => {
  // Ownership moves through a transfer, not through this menu.
  if (isCurrentUser || member.role === "owner" || disabled) {
    return (
      <span
        className={cn(
          pill,
          member.role === "owner" ? "bg-hover" : "bg-surface",
        )}
      >
        {formatRole(member.role)}
      </span>
    );
  }

  return (
    <Select
      value={member.role}
      onValueChange={(value) => {
        if (value === "") return;
        onRoleChange(member.id, value as Role);
      }}
    >
      <SelectTrigger
        size="sm"
        aria-label={`Role for ${member.user.name}`}
        className={cn(pill, "w-auto bg-surface shadow-none data-[size=sm]:h-7")}
      >
        <SelectValue />
      </SelectTrigger>

      <SelectContent>
        <SelectItem value="admin">Admin</SelectItem>
        <SelectItem value="member">Member</SelectItem>
      </SelectContent>
    </Select>
  );
};

type Props = {
  members: Member[];
  /** Team names and last activity per user id. */
  extras?: Record<string, { teams: string[]; lastActive: string | null }>;
  userId: string;
  permissions: {
    canRemoveMembers: boolean;
    canUpdateMemberRoles: boolean;
  };
};

export const MembersSection: FC<Props> = ({
  members: initialMembers,
  userId,
  permissions,
  extras = {},
}) => {
  const canInvite = usePermission("members.invite");
  const canTransfer = usePermission("org.ownership.transfer");
  const [members, setMembers] = useState(initialMembers);
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);
  const [accessMember, setAccessMember] = useState<Member | null>(null);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [teamFilter, setTeamFilter] = useState("all");
  const [page, setPage] = useState(0);
  const canManageAccess = useAnyPermission([
    "roles.assign",
    "permissions.overrides.manage",
  ]);

  const router = useRouter();
  const trpc = useTrpcClient();

  const currentUser = members.find((member) => member.userId === userId);
  const ownerCount = members.filter((member) => member.role === "owner").length;
  const teamNames = [
    ...new Set(Object.values(extras).flatMap((entry) => entry.teams)),
  ].sort();

  const needle = query.trim().toLowerCase();
  const filtered = members.filter((member) => {
    const teams = extras[member.userId]?.teams ?? [];

    if (
      needle &&
      !member.user.name.toLowerCase().includes(needle) &&
      !member.user.email.toLowerCase().includes(needle)
    ) {
      return false;
    }
    if (roleFilter !== "all" && member.role !== roleFilter) return false;
    if (teamFilter === "none") return teams.length === 0;
    if (teamFilter !== "all" && !teams.includes(teamFilter)) return false;

    return true;
  });
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const visible = filtered.slice(
    current * PAGE_SIZE,
    (current + 1) * PAGE_SIZE,
  );

  const handleRoleChange = async (memberId: string, role: Role) => {
    setMembers((currentMembers) =>
      currentMembers.map((member) =>
        member.id === memberId ? { ...member, role } : member,
      ),
    );

    const { error } = await trpcResult(
      trpc.member.updateRole.mutate({
        memberId,
        role: role === "owner" ? "admin" : role,
      }),
    );

    if (error) {
      toastError(error.statusText, error.message);
      return;
    }

    toastSuccess("Role changed", "Their access updates right away.");
    router.refresh();
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;

    const { error } = await trpcResult(
      trpc.member.remove.mutate({ memberId: memberToRemove.id }),
    );

    if (error) {
      toastError(error.statusText, error.message);
      return;
    }

    toastSuccess(
      "Member removed",
      `${memberToRemove.user.name} no longer has access.`,
    );
    router.refresh();
  };

  const filtersOn =
    Boolean(needle) || roleFilter !== "all" || teamFilter !== "all";

  return (
    <div className="flex flex-col gap-5">
      <SettingsHeader
        eyebrow="ORGANIZATION"
        title="Members"
        description="Everyone in this organization, their role and when they were last around."
      />

      {ownerCount === 1 && currentUser?.role === "owner" ? (
        <div className="flex flex-col gap-2 rounded-md border border-warning/40 bg-warning-subtle px-4 py-3 sm:flex-row sm:items-center sm:gap-3">
          <AlertCircleIcon
            aria-hidden="true"
            className="size-5 shrink-0 text-warning-text"
          />
          <p className="flex-1 text-sm text-ink-2">
            <span className="font-semibold text-ink">
              You&apos;re the only owner.
            </span>{" "}
            If you leave, nobody can delete the organization or hand it on.
          </p>
          {canTransfer ? (
            <Link
              href={paths.dangerSettings()}
              className="text-sm font-medium whitespace-nowrap text-signal-strong hover:underline"
            >
              Transfer ownership
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <label className="relative w-full sm:w-60">
          <span className="sr-only">Search name or email</span>
          <SearchIcon
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3"
          />
          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(0);
            }}
            placeholder="Search name or email"
            className="h-8 rounded-md bg-surface pl-9 text-[13px]"
          />
        </label>
        <FilterSelect
          label="Role"
          value={roleFilter}
          onChange={(value) => {
            setRoleFilter(value);
            setPage(0);
          }}
          options={[
            { value: "owner", label: "Owner" },
            { value: "admin", label: "Admin" },
            { value: "member", label: "Member" },
          ]}
        />
        <FilterSelect
          label="Team"
          value={teamFilter}
          onChange={(value) => {
            setTeamFilter(value);
            setPage(0);
          }}
          options={[
            ...teamNames.map((name) => ({ value: name, label: name })),
            { value: "none", label: "No team" },
          ]}
        />
        <span className="font-mono text-xs text-ink-3">
          {filtered.length} {filtered.length === 1 ? "member" : "members"}
        </span>
      </div>

      {members.length === 1 && canInvite ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-line-strong px-6 py-14 text-center">
          <p className="font-serif-italic text-[2rem] leading-10">
            Just you so far.
          </p>
          <p className="max-w-[420px] text-[15px] leading-[22px] text-ink-2">
            Invite teammates by email. They&apos;ll join with the role you pick,
            and you can change it any time.
          </p>
        </div>
      ) : null}

      <div
        role="table"
        aria-label="Members"
        className={cn(
          "flex flex-col",
          members.length === 1 && canInvite && "hidden",
        )}
      >
        <div
          role="row"
          className="flex h-9 items-center gap-3 border-b border-hairline px-3 font-mono text-[11px] tracking-[0.08em] text-ink-3 uppercase"
        >
          <span role="columnheader" className="min-w-0 flex-1">
            Member
          </span>
          <span role="columnheader" className="w-28 sm:w-32">
            Role
          </span>
          <span role="columnheader" className="hidden w-32 lg:block">
            Team
          </span>
          <span role="columnheader" className="hidden w-28 md:block">
            Last active
          </span>
          <span role="columnheader" className="hidden w-20 xl:block">
            Joined
          </span>
          <span role="columnheader" className="w-8">
            <span className="sr-only">Actions</span>
          </span>
        </div>

        {visible.map((member) => {
          const isCurrentUser = member.userId === userId;
          const teams = extras[member.userId]?.teams ?? [];
          const lastActive = shortAgo(
            extras[member.userId]?.lastActive ?? null,
          );
          const canAct =
            !isCurrentUser && (permissions.canRemoveMembers || canManageAccess);

          return (
            <div
              role="row"
              key={member.id}
              className="flex min-h-[57px] items-center gap-3 border-b border-hairline/60 px-3 py-2"
            >
              <span
                role="cell"
                className="flex min-w-0 flex-1 items-center gap-3"
              >
                <ActorAvatar name={member.user.name} size={32} />
                <span className="flex min-w-0 flex-col">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-[15px] font-medium">
                      {member.user.name}
                    </span>
                    {isCurrentUser ? (
                      <span className="rounded-xs border border-hairline px-1.5 font-mono text-[10px] text-ink-2 uppercase">
                        You
                      </span>
                    ) : null}
                  </span>
                  <span className="truncate font-mono text-xs text-ink-3">
                    {member.user.email}
                  </span>
                </span>
              </span>
              <span role="cell" className="w-28 sm:w-32">
                <RoleControl
                  disabled={!permissions.canUpdateMemberRoles}
                  isCurrentUser={isCurrentUser}
                  member={member}
                  onRoleChange={handleRoleChange}
                />
              </span>
              <span
                role="cell"
                className="hidden w-32 items-center gap-2 text-sm text-ink-2 lg:flex"
              >
                {teams.length ? (
                  <>
                    <span
                      aria-hidden="true"
                      className={cn(
                        "size-2 shrink-0 rounded-full border border-hairline",
                        dotFor(teams[0]!),
                      )}
                    />
                    <span className="truncate" title={teams.join(", ")}>
                      {teams[0]}
                      {teams.length > 1 ? ` +${teams.length - 1}` : ""}
                    </span>
                  </>
                ) : (
                  <>
                    <span
                      aria-hidden="true"
                      className="size-2 shrink-0 rounded-full border border-dashed border-ink-3"
                    />
                    No team
                  </>
                )}
              </span>
              <span
                role="cell"
                suppressHydrationWarning
                className="hidden w-28 items-center gap-1.5 font-mono text-xs text-ink-2 md:flex"
              >
                {lastActive === "Active now" ? (
                  <span
                    aria-hidden="true"
                    className="size-1.5 rounded-full bg-success"
                  />
                ) : null}
                {lastActive}
              </span>
              <span
                role="cell"
                suppressHydrationWarning
                className="hidden w-20 font-mono text-xs text-ink-3 xl:block"
              >
                {monthYear(member.createdAt)}
              </span>
              <span role="cell" className="flex w-8 justify-end">
                {canAct ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm">
                        <MoreHorizontalIcon className="size-4" />
                        <span className="sr-only">Open member actions</span>
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="w-44">
                      {canManageAccess ? (
                        <DropdownMenuItem
                          className="gap-2"
                          onClick={() => setAccessMember(member)}
                        >
                          <ShieldIcon className="size-4" />
                          Manage access
                        </DropdownMenuItem>
                      ) : null}
                      {permissions.canRemoveMembers ? (
                        <DropdownMenuItem
                          variant="destructive"
                          className="gap-2"
                          onClick={() => setMemberToRemove(member)}
                        >
                          <Trash2Icon className="size-4" />
                          Remove member
                        </DropdownMenuItem>
                      ) : null}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}
              </span>
            </div>
          );
        })}

        {visible.length === 0 && filtersOn ? (
          <p className="px-3 py-10 text-center text-sm text-ink-2">
            Nobody matches those filters.
          </p>
        ) : null}
      </div>

      {filtered.length > PAGE_SIZE ? (
        <div className="flex items-center gap-2">
          <span className="flex-1 font-mono text-xs text-ink-3">
            {current * PAGE_SIZE + 1}–
            {Math.min((current + 1) * PAGE_SIZE, filtered.length)} of{" "}
            {filtered.length}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
          >
            <ChevronLeftIcon />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={current >= pageCount - 1}
            onClick={() => setPage(current + 1)}
          >
            Next
            <ChevronRightIcon />
          </Button>
        </div>
      ) : null}

      {accessMember ? (
        <MemberAccessDialog
          userId={accessMember.userId}
          name={accessMember.user.name}
          baseRole={accessMember.role}
          open
          onOpenChange={(open) => {
            if (!open) setAccessMember(null);
          }}
        />
      ) : null}

      <AlertDialog
        open={Boolean(memberToRemove)}
        onOpenChange={(open) => {
          if (!open) {
            setMemberToRemove(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member?</AlertDialogTitle>

            <AlertDialogDescription>
              {memberToRemove?.user.name} will lose access to this organization
              and its workspace apps.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>

            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleRemoveMember}
            >
              Remove member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
