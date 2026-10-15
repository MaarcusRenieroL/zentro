"use client";

import { FC, useCallback, useEffect, useState } from "react";

import { useTrpcClient } from "@zentro/api/react";
import { cn, toastError, toastSuccess } from "@zentro/ui/index";
import { GlobeIcon, LockIcon, PlusIcon, UsersIcon, XIcon } from "lucide-react";
import { Button } from "@zentro/ui/shadcn/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zentro/ui/shadcn/select";
import { Skeleton } from "@zentro/ui/shadcn/skeleton";

import { ActorAvatar } from "~/src/components/actor-avatar";
import { usePermission } from "~/src/components/permissions/permission-provider";
import { trpcResult } from "~/src/lib/trpc-result";

type Visibility = "organization" | "team" | "private";
type Option = { id: string; label: string };
type Access = {
  projectId: string;
  visibility: Visibility;
  teamId: string | null;
  availableRoles: Array<{ id: string; name: string }>;
  assignments: Array<{
    id: string;
    roleId: string;
    roleName: string;
    principalType: "user" | "team";
    principalId: string;
    principalName: string;
  }>;
};

const noTeam = "__none__";

const visibilityCards: Record<
  Visibility,
  { title: string; body: string; Icon: typeof GlobeIcon }
> = {
  organization: {
    title: "Everyone in the organization",
    body: "Anyone in the organization can find and view it. Editing still needs a project role.",
    Icon: GlobeIcon,
  },
  team: {
    title: "The owning team",
    body: "The owning team and the people added below. Hidden from everyone else.",
    Icon: UsersIcon,
  },
  private: {
    title: "Only people added here",
    body: "Hidden from search and Projects for everyone else, except owners and admins.",
    Icon: LockIcon,
  },
};

export const ProjectAccessSection: FC<{ slug: string }> = ({ slug }) => {
  const trpc = useTrpcClient();
  const [access, setAccess] = useState<Access | null>(null);
  const [visibility, setVisibility] = useState<Visibility>("organization");
  const [teamId, setTeamId] = useState(noTeam);
  const [people, setPeople] = useState<Option[]>([]);
  const [teamOptions, setTeamOptions] = useState<Option[]>([]);
  const [principal, setPrincipal] = useState("");
  const [roleId, setRoleId] = useState("");
  const [adding, setAdding] = useState(false);
  const canManage = usePermission("projects.settings.manage", {
    projectId: access?.projectId,
  });
  const canAssign = usePermission("projects.members.manage", {
    projectId: access?.projectId,
  });

  const load = useCallback(async () => {
    const { data, error } = await trpcResult(
      trpc.project.getAccess.query({ slug }),
    );

    if (error) {
      toastError(error.statusText, error.message);

      return;
    }

    setAccess(data as Access);
    setVisibility(data.visibility as Visibility);
    setTeamId(data.teamId ?? noTeam);
  }, [trpc, slug]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void Promise.all([
      trpcResult(trpc.member.getMembers.query()),
      trpcResult(trpc.team.getAll.query()),
    ]).then(([members, teamList]) => {
      setPeople(
        (members.data ?? []).map((member) => ({
          id: `user:${member.userId}`,
          label: member.name || member.email,
        })),
      );
      setTeamOptions(
        (teamList.data ?? []).map((team) => ({
          id: team.id,
          label: team.name,
        })),
      );
    });
  }, [trpc]);

  if (!access) {
    return <Skeleton className="h-64 w-full" />;
  }

  const saveVisibility = async () => {
    const { error } = await trpcResult(
      trpc.project.updateAccess.mutate({
        slug,
        visibility,
        teamId: teamId === noTeam ? null : teamId,
      }),
    );

    if (error) {
      toastError(error.statusText, error.message);

      return;
    }

    toastSuccess("Project access updated");
    await load();
  };

  const assign = async () => {
    const [type, id] = principal.split(":") as ["user" | "team", string];
    const { error } = await trpcResult(
      trpc.permissions.assignments.assign.mutate({
        roleId,
        principalType: type,
        principalId: id,
        scopeType: "project",
        scopeId: access.projectId,
      }),
    );

    if (error) {
      toastError(error.statusText, error.message);

      return;
    }

    toastSuccess("Role assigned");
    setPrincipal("");
    setAdding(false);
    await load();
  };

  const unassign = async (assignmentId: string) => {
    const { error } = await trpcResult(
      trpc.permissions.assignments.unassign.mutate({ assignmentId }),
    );

    if (error) {
      toastError(error.statusText, error.message);

      return;
    }

    toastSuccess("Role removed");
    await load();
  };

  const changeRole = async (
    assignment: Access["assignments"][number],
    nextRoleId: string,
  ) => {
    if (nextRoleId === assignment.roleId) return;

    // A role is changed by giving the new one, then taking the old one away.
    const added = await trpcResult(
      trpc.permissions.assignments.assign.mutate({
        roleId: nextRoleId,
        principalType: assignment.principalType,
        principalId: assignment.principalId,
        scopeType: "project",
        scopeId: access.projectId,
      }),
    );

    if (added.error) {
      toastError(added.error.statusText, added.error.message);

      return;
    }

    const removed = await trpcResult(
      trpc.permissions.assignments.unassign.mutate({
        assignmentId: assignment.id,
      }),
    );

    if (removed.error) {
      toastError(removed.error.statusText, removed.error.message);
    } else {
      toastSuccess("Role changed");
    }

    await load();
  };

  const visibilityChanged =
    visibility !== access.visibility ||
    (teamId === noTeam ? null : teamId) !== access.teamId;
  const field =
    "h-11 w-full justify-start gap-2.5 rounded-md border-hairline bg-surface text-[15px] shadow-none data-[size=default]:h-11 [&>svg:last-child]:ml-auto";

  return (
    <div className="flex max-w-[860px] flex-col gap-7">
      <section className="flex flex-col gap-2.5">
        <h2 className="text-[15px] font-semibold">Who can see this project</h2>
        <div
          role="radiogroup"
          aria-label="Project visibility"
          className="grid gap-3 md:grid-cols-3"
        >
          {(Object.keys(visibilityCards) as Visibility[]).map((key) => {
            const card = visibilityCards[key];
            const on = visibility === key;

            return (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={on}
                disabled={!canManage}
                onClick={() => setVisibility(key)}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default",
                  on
                    ? "border-signal bg-selected"
                    : "border-hairline bg-surface hover:border-ink-3",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-[1.5px]",
                    on ? "border-signal" : "border-line-strong",
                  )}
                >
                  {on ? (
                    <span className="size-2 rounded-full bg-signal" />
                  ) : null}
                </span>
                <span className="flex flex-col gap-1">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <card.Icon className="size-3.5" aria-hidden="true" />
                    {card.title}
                  </span>
                  <span className="text-[13px] leading-5 text-ink-2">
                    {card.body}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="flex max-w-[420px] flex-col gap-1.5">
        <h2 className="text-[15px] font-semibold">Owning team</h2>
        <Select
          value={teamId}
          onValueChange={(value) => value !== "" && setTeamId(value)}
          disabled={!canManage}
        >
          <SelectTrigger aria-label="Owning team" className={field}>
            <span
              aria-hidden="true"
              className="size-2.5 rounded-[3px] border border-hairline bg-tint-teams"
            />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={noTeam}>No team</SelectItem>
            {teamOptions.map((team) => (
              <SelectItem key={team.id} value={team.id}>
                {team.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[13px] text-ink-3">
          {visibility === "team"
            ? "Members of the owning team can see this project."
            : "The owning team is who this project belongs to."}{" "}
          A role given to a person below applies on top of it.
        </p>
      </section>

      {canManage && visibilityChanged ? (
        <div
          role="status"
          className="flex flex-wrap items-center gap-2.5 rounded-xl border border-hairline bg-overlay py-2.5 pr-2.5 pl-4 shadow-lg motion-safe:animate-fade-up"
        >
          <span
            aria-hidden="true"
            className="size-2 rounded-full bg-status-progress"
          />
          <span className="text-sm">You changed who can see this project.</span>
          <span className="flex-1" />
          <Button
            variant="outline"
            onClick={() => {
              setVisibility(access.visibility);
              setTeamId(access.teamId ?? noTeam);
            }}
            className="h-9 border-hairline bg-transparent px-3"
          >
            Discard
          </Button>
          <Button onClick={saveVisibility} className="h-9 px-3 font-semibold">
            Save visibility
          </Button>
        </div>
      ) : null}

      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-2.5">
          <h2 className="text-[15px] font-semibold">People</h2>
          <span className="font-mono text-xs text-ink-2">
            {access.assignments.length}
          </span>
          <span className="flex-1" />
          {canAssign ? (
            <Button
              onClick={() => setAdding((value) => !value)}
              aria-expanded={adding}
              className="h-9 px-3 font-semibold"
            >
              <PlusIcon />
              Add people
            </Button>
          ) : null}
        </div>

        {adding && canAssign ? (
          <div className="grid gap-2.5 rounded-xl border border-hairline bg-surface p-3 md:grid-cols-[1fr_200px_auto]">
            <Select value={principal} onValueChange={setPrincipal}>
              <SelectTrigger aria-label="Person or team" className={field}>
                <SelectValue placeholder="Person or team" />
              </SelectTrigger>
              <SelectContent>
                {people.map((person) => (
                  <SelectItem key={person.id} value={person.id}>
                    {person.label}
                  </SelectItem>
                ))}
                {teamOptions.map((team) => (
                  <SelectItem key={team.id} value={`team:${team.id}`}>
                    Team: {team.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={roleId} onValueChange={setRoleId}>
              <SelectTrigger aria-label="Project role" className={field}>
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                {access.availableRoles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              disabled={!principal || !roleId}
              onClick={assign}
              className="h-11 px-4"
            >
              Add
            </Button>
          </div>
        ) : null}

        {access.assignments.length ? (
          <ul className="flex flex-col">
            {access.assignments.map((assignment) => (
              <li
                key={assignment.id}
                className="flex min-h-14 items-center gap-3 border-t border-hairline/70 px-2 py-2"
              >
                {assignment.principalType === "user" ? (
                  <ActorAvatar name={assignment.principalName} size={30} />
                ) : (
                  <span
                    aria-hidden="true"
                    className="flex size-[30px] items-center justify-center rounded-sm border border-hairline bg-tint-teams font-mono text-[11px]"
                  >
                    {assignment.principalName.charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium">
                    {assignment.principalName}
                  </span>
                  <span className="font-mono text-[11px] text-ink-3">
                    {assignment.principalType === "team"
                      ? "Everyone on this team"
                      : "Person"}
                  </span>
                </span>
                <span className="hidden text-[13px] text-ink-3 sm:block">
                  {assignment.principalType === "team"
                    ? "Via team"
                    : "Added directly"}
                </span>
                {canAssign ? (
                  <Select
                    value={assignment.roleId}
                    onValueChange={(value) =>
                      value && void changeRole(assignment, value)
                    }
                  >
                    <SelectTrigger
                      aria-label={`Role for ${assignment.principalName}`}
                      className="h-8 w-[150px] rounded-md border-hairline bg-transparent text-[13px] shadow-none data-[size=default]:h-8"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {access.availableRoles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="rounded-sm border border-hairline px-2 py-0.5 text-[13px]">
                    {assignment.roleName}
                  </span>
                )}
                {canAssign ? (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="size-8 text-ink-3"
                    aria-label={`Remove ${assignment.principalName}`}
                    onClick={() => unassign(assignment.id)}
                  >
                    <XIcon className="size-3.5" />
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed border-line-strong px-4 py-8 text-center text-sm text-ink-3">
            No one has a role on this project alone yet. Organization roles
            still apply.
          </p>
        )}
        <p className="pt-1 text-[13px] text-ink-3">
          Organization owners and admins can always open this project.
        </p>
      </section>
    </div>
  );
};
