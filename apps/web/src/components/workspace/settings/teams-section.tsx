"use client";

import { TeamRolesPanel } from "~/src/components/workspace/roles/team-roles-panel";
import { usePermission } from "~/src/components/permissions/permission-provider";
import { useEffect, useMemo, useState } from "react";
import {
  Edit3Icon,
  FileTextIcon,
  LayoutGridIcon,
  PlusIcon,
  SquareCheckIcon,
  Trash2Icon,
  UserPlusIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { ActorAvatar } from "~/src/components/actor-avatar";
import { paths } from "~/src/lib/paths";

import { useTrpcClient } from "@zentro/api/react";
import { cn, toastError, toastSuccess } from "@zentro/ui";
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
import { Badge } from "@zentro/ui/components/shadcn/badge";
import { Button } from "@zentro/ui/components/shadcn/button";
import { Card } from "@zentro/ui/components/shadcn/card";
import { Checkbox } from "@zentro/ui/components/shadcn/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@zentro/ui/components/shadcn/dialog";
import { Input } from "@zentro/ui/components/shadcn/input";
import { Label } from "@zentro/ui/components/shadcn/label";
import { Skeleton } from "@zentro/ui/components/shadcn/skeleton";
import { Textarea } from "@zentro/ui/components/shadcn/textarea";

type TeamColor =
  | "slate"
  | "red"
  | "orange"
  | "amber"
  | "green"
  | "blue"
  | "purple"
  | "pink";

type AvailableMember = {
  id: string;
  role: string;
  userId: string;
  name: string;
  email: string;
  image: string | null;
};

type TeamMember = AvailableMember & {
  teamId: string;
  memberId: string;
  createdAt: Date;
};

type Team = {
  id: string;
  name: string;
  description: string | null;
  color: string;
  createdByMemberId: string | null;
  createdAt: Date;
  updatedAt: Date;
  members: TeamMember[];
};

type TeamScopeCounts = Record<
  string,
  {
    projects: number;
    archived: number;
    tasks: number;
    docs: number;
  }
>;

type TeamFormState = {
  name: string;
  description: string;
  color: TeamColor;
  memberIds: string[];
};

type TeamsSectionProps = {
  permissions: {
    canCreateTeams: boolean;
    canUpdateTeams: boolean;
    canDeleteTeams: boolean;
    canManageTeamMembers: boolean;
  };
};

const teamColors: Array<{
  value: TeamColor;
  label: string;
  className: string;
}> = [
  { value: "slate", label: "Slate", className: "bg-ink-3" },
  { value: "red", label: "Red", className: "cat-1 bg-(--cat)" },
  { value: "orange", label: "Orange", className: "cat-2 bg-(--cat)" },
  { value: "amber", label: "Amber", className: "cat-3 bg-(--cat)" },
  { value: "green", label: "Green", className: "cat-4 bg-(--cat)" },
  { value: "blue", label: "Blue", className: "cat-6 bg-(--cat)" },
  { value: "purple", label: "Purple", className: "cat-7 bg-(--cat)" },
  { value: "pink", label: "Pink", className: "cat-8 bg-(--cat)" },
];

const emptyForm: TeamFormState = {
  name: "",
  description: "",
  color: "slate",
  memberIds: [],
};

function getColorClass(color: string) {
  return (
    teamColors.find((teamColor) => teamColor.value === color)?.className ??
    "bg-ink-3"
  );
}

function formatRole(role: string) {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function sortMembers<T extends Pick<AvailableMember, "email" | "name">>(
  members: T[],
) {
  return [...members].sort(
    (a, b) => a.name.localeCompare(b.name) || a.email.localeCompare(b.email),
  );
}

type TeamDialogProps = {
  availableMembers: AvailableMember[];
  form: TeamFormState;
  mode: "create" | "edit";
  open: boolean;
  saving: boolean;
  teamId: string | null;
  onChange: (form: TeamFormState) => void;
  onOpenChange: (open: boolean) => void;
  /** What the person may change, so only that is saved. */
  onSubmit: (changes: { details: boolean; members: boolean }) => void;
};

function TeamDialog({
  availableMembers,
  form,
  mode,
  open,
  saving,
  teamId,
  onChange,
  onOpenChange,
  onSubmit,
}: TeamDialogProps) {
  const sortedMembers = useMemo(
    () => sortMembers(availableMembers),
    [availableMembers],
  );

  // Rights on this team: a team lead holds them for their own team only.
  const scope = mode === "edit" && teamId ? { teamId } : undefined;
  const canViewRoles = usePermission("roles.view");
  const canManageMembers = usePermission("teams.members.manage", scope);
  const canUpdateTeam = usePermission("teams.update", scope);
  const canEditDetails = mode === "create" || canUpdateTeam;

  function toggleMember(memberId: string) {
    if (!canManageMembers) {
      return;
    }

    onChange({
      ...form,
      memberIds: form.memberIds.includes(memberId)
        ? form.memberIds.filter((id) => id !== memberId)
        : [...form.memberIds, memberId],
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create team" : "Edit team"}
          </DialogTitle>
          <DialogDescription>
            Group workspace members so projects, ownership, and planning can
            stay easier to scan.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor="team-name">Name</Label>
            <Input
              id="team-name"
              disabled={!canEditDetails}
              value={form.name}
              placeholder="Design"
              onChange={(event) =>
                onChange({ ...form, name: event.target.value })
              }
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="team-description">Description</Label>
            <Textarea
              id="team-description"
              disabled={!canEditDetails}
              className="min-h-24 resize-none"
              value={form.description}
              placeholder="What does this team own?"
              onChange={(event) =>
                onChange({ ...form, description: event.target.value })
              }
            />
          </div>

          <div className="grid gap-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {teamColors.map((teamColor) => (
                <button
                  key={teamColor.value}
                  type="button"
                  disabled={!canEditDetails}
                  className={cn(
                    "flex h-8 items-center gap-2 rounded-md border px-2.5 text-sm transition-colors hover:bg-muted",
                    form.color === teamColor.value && "border-foreground",
                  )}
                  onClick={() => onChange({ ...form, color: teamColor.value })}
                >
                  <span
                    className={cn("size-3 rounded-full", teamColor.className)}
                  />
                  {teamColor.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
              <Label>Members</Label>
              <Badge variant="secondary">
                {form.memberIds.length} selected
              </Badge>
            </div>
            <div className="max-h-72 overflow-y-auto rounded-lg border">
              {sortedMembers.map((member) => {
                const checked = form.memberIds.includes(member.id);

                return (
                  <div
                    key={member.id}
                    className="flex w-full items-center gap-3 border-b px-3 py-3 text-left last:border-b-0 hover:bg-muted/40"
                  >
                    <Checkbox
                      checked={checked}
                      disabled={!canManageMembers}
                      onCheckedChange={() => toggleMember(member.id)}
                    />
                    <ActorAvatar name={member.name} size={32} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {member.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {member.email}
                      </p>
                    </div>
                    <Badge variant="outline">{formatRole(member.role)}</Badge>
                  </div>
                );
              })}
            </div>
            {!canManageMembers ? (
              <p className="text-xs text-muted-foreground">
                You can edit team details, but only admins and owners can manage
                team membership.
              </p>
            ) : null}
          </div>
          {mode === "edit" && teamId && (canViewRoles || canManageMembers) ? (
            <TeamRolesPanel
              teamId={teamId}
              members={sortedMembers
                .filter((member) => form.memberIds.includes(member.id))
                .map((member) => ({
                  userId: member.userId,
                  name: member.name ?? member.email,
                }))}
            />
          ) : null}
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={saving || form.name.trim().length < 2}
            onClick={() =>
              onSubmit({
                details: canEditDetails,
                members: mode === "create" || canManageMembers,
              })
            }
          >
            {saving
              ? mode === "create"
                ? "Creating..."
                : "Saving..."
              : mode === "create"
                ? "Create team"
                : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** The buttons of one team card, judged by what the person may do to it. */
function TeamActions({
  teamId,
  onEdit,
  onDelete,
}: {
  teamId: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const canUpdate = usePermission("teams.update", { teamId });
  const canManageMembers = usePermission("teams.members.manage", { teamId });
  const canDelete = usePermission("teams.delete", { teamId });

  return (
    <div className="-mx-1 flex flex-wrap gap-1 border-t border-hairline/70 pt-2.5">
      <Button variant="ghost" size="sm" disabled={!canUpdate} onClick={onEdit}>
        <Edit3Icon className="size-4" />
        Edit
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={!canManageMembers}
        onClick={onEdit}
      >
        <UserPlusIcon className="size-4" />
        Members
      </Button>
      <span className="flex-1" />
      <Button
        variant="ghost"
        size="sm"
        className="text-danger-text"
        disabled={!canDelete}
        onClick={onDelete}
      >
        <Trash2Icon className="size-4" />
        Delete
      </Button>
    </div>
  );
}

export function TeamsSection({ permissions }: TeamsSectionProps) {
  const trpc = useTrpcClient();
  const [teams, setTeams] = useState<Team[]>([]);
  const [availableMembers, setAvailableMembers] = useState<AvailableMember[]>(
    [],
  );
  const [scopeCounts, setScopeCounts] = useState<TeamScopeCounts>({});
  const [isLoading, setIsLoading] = useState(true);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [form, setForm] = useState<TeamFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);

  async function loadTeams() {
    setIsLoading(true);

    try {
      const [teamList, memberList] = await Promise.all([
        trpc.team.getAll.query(),
        trpc.team.getAvailableMembers.query(),
      ]);
      const [projectList, taskList, docList] = await Promise.all([
        // Turned-off modules reject these calls; they simply count as zero.
        trpc.project.getProjectsByOrgId.query().catch(() => []),
        trpc.task.getTasksByOrgId.query({}).catch(() => []),
        trpc.docs.getAll.query({}).catch(() => []),
      ]);
      const nextScopeCounts: TeamScopeCounts = {};

      for (const team of teamList) {
        nextScopeCounts[team.id] = {
          projects: 0,
          archived: 0,
          tasks: 0,
          docs: 0,
        };
      }

      for (const project of projectList) {
        if (project.teamId) {
          const counts = nextScopeCounts[project.teamId];

          if (counts) {
            counts.projects += 1;
            if (project.archivedAt) counts.archived += 1;
          }
        }
      }

      for (const task of taskList) {
        // Only work still to do counts as the team's load.
        if (task.teamId && task.status !== "done") {
          const counts = nextScopeCounts[task.teamId];

          if (counts) {
            counts.tasks += 1;
          }
        }
      }

      for (const doc of docList) {
        if (doc.teamId) {
          const counts = nextScopeCounts[doc.teamId];

          if (counts) {
            counts.docs += 1;
          }
        }
      }

      setTeams(teamList);
      setAvailableMembers(memberList);
      setScopeCounts(nextScopeCounts);
    } catch (error) {
      toastError(error, "Failed to load teams");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadTeams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // "New team" in the Team header and "Edit team" on a team's page open the
  // dialog here through the URL.
  const searchParams = useSearchParams();
  const router = useRouter();
  const wantsNew = searchParams.get("new") === "1";
  const wantsEdit = searchParams.get("edit");

  useEffect(() => {
    if (isLoading || (!wantsNew && !wantsEdit)) return;

    const team = wantsEdit
      ? teams.find((entry) => entry.id === wantsEdit)
      : null;

    if (wantsNew && permissions.canCreateTeams) openCreateDialog();
    if (team) openEditDialog(team);
    router.replace(paths.teamsSettings(), { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, wantsNew, wantsEdit]);

  function openCreateDialog() {
    setDialogMode("create");
    setEditingTeamId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEditDialog(team: Team) {
    setDialogMode("edit");
    setEditingTeamId(team.id);
    setForm({
      name: team.name,
      description: team.description ?? "",
      color: team.color as TeamColor,
      memberIds: team.members.map((member) => member.memberId),
    });
    setDialogOpen(true);
  }

  async function saveTeam(changes: { details: boolean; members: boolean }) {
    try {
      setSaving(true);

      if (dialogMode === "create") {
        await trpc.team.create.mutate({
          name: form.name,
          description: form.description,
          color: form.color,
          memberIds: form.memberIds,
        });
        toastSuccess("Team created");
      } else if (editingTeamId) {
        if (changes.details) {
          await trpc.team.update.mutate({
            id: editingTeamId,
            name: form.name,
            description: form.description,
            color: form.color,
          });
        }

        if (changes.members) {
          await trpc.team.updateMembers.mutate({
            teamId: editingTeamId,
            memberIds: form.memberIds,
          });
        }
        toastSuccess("Team updated");
      }

      setDialogOpen(false);
      await loadTeams();
    } catch (error) {
      toastError(error, "Failed to save team");
    } finally {
      setSaving(false);
    }
  }

  async function deleteTeam() {
    if (!teamToDelete) {
      return;
    }

    try {
      await trpc.team.delete.mutate({ id: teamToDelete.id });
      toastSuccess("Team deleted");
      setTeamToDelete(null);
      await loadTeams();
    } catch (error) {
      toastError(error, "Failed to delete team");
    }
  }

  const people = availableMembers.length;
  const inATeam = new Set(
    teams.flatMap((team) => team.members.map((member) => member.memberId)),
  );
  const noTeam = sortMembers(
    availableMembers.filter((member) => !inATeam.has(member.id)),
  );
  const largest = [...teams].sort(
    (a, b) => b.members.length - a.members.length,
  )[0];
  const ownedProjects = Object.values(scopeCounts).reduce(
    (total, counts) => total + counts.projects,
    0,
  );
  const archivedProjects = Object.values(scopeCounts).reduce(
    (total, counts) => total + counts.archived,
    0,
  );
  const firstNames = (list: AvailableMember[]) => {
    const names = list.map((member) => member.name);

    if (names.length <= 2) return names.join(" and ");

    return `${names.slice(0, 2).join(", ")} and ${names.length - 2} more`;
  };

  const stats = [
    {
      label: "Teams",
      value: teams.length,
      note: largest?.members.length
        ? `${largest.name} is the largest`
        : "None yet",
    },
    { label: "In a team", value: inATeam.size, note: `of ${people} people` },
    {
      label: "Projects owned",
      value: ownedProjects,
      note: `${ownedProjects - archivedProjects} active, ${archivedProjects} archived`,
    },
    {
      label: "No team",
      value: noTeam.length,
      note: noTeam.length ? firstNames(noTeam) : "Everyone has a team",
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      {isLoading ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : teams.length ? (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="tile flex flex-col gap-1 p-4">
                <span className="eyebrow">{stat.label}</span>
                <span className="font-serif-italic text-[2.25rem] leading-10">
                  {stat.value}
                </span>
                <span className="truncate text-xs text-ink-2">{stat.note}</span>
              </div>
            ))}
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            {teams.map((team) => {
              const counts = scopeCounts[team.id];
              const shown = sortMembers(team.members).slice(0, 4);

              return (
                <Card
                  key={team.id}
                  className="gap-0 overflow-hidden rounded-xl py-0 shadow-none"
                >
                  <div className="flex items-center gap-2.5 border-b border-hairline bg-tint-teams px-4 py-3">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "size-2.5 shrink-0 rounded-full",
                        getColorClass(team.color),
                      )}
                    />
                    <Link
                      href={paths.teamSettings(team.id)}
                      className="min-w-0 flex-1 truncate font-semibold outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {team.name}
                    </Link>
                    <span className="flex items-center">
                      {shown.map((member) => (
                        <span
                          key={member.id}
                          title={member.name}
                          className="-ml-1.5 rounded-full ring-2 ring-surface first:ml-0"
                        >
                          <ActorAvatar name={member.name} size={22} />
                        </span>
                      ))}
                      {team.members.length > shown.length ? (
                        <span className="ml-1.5 font-mono text-xs text-ink-2">
                          +{team.members.length - shown.length}
                        </span>
                      ) : null}
                    </span>
                  </div>
                  <div className="flex flex-col gap-3 px-4 py-3.5">
                    <p className="line-clamp-2 text-sm text-ink-2">
                      {team.description || "No description yet."}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-2">
                      <span className="flex items-center gap-1.5">
                        <LayoutGridIcon
                          aria-hidden="true"
                          className="size-3.5 text-ink-3"
                        />
                        {counts?.projects ?? 0}{" "}
                        {counts?.projects === 1 ? "project" : "projects"}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <SquareCheckIcon
                          aria-hidden="true"
                          className="size-3.5 text-ink-3"
                        />
                        {counts?.tasks ?? 0} open tasks
                      </span>
                      <span className="flex items-center gap-1.5">
                        <FileTextIcon
                          aria-hidden="true"
                          className="size-3.5 text-ink-3"
                        />
                        {counts?.docs ?? 0} docs
                      </span>
                      <span className="flex-1" />
                      <span className="text-ink-3">
                        {team.members.length}{" "}
                        {team.members.length === 1 ? "member" : "members"}
                      </span>
                    </div>
                    <TeamActions
                      teamId={team.id}
                      onEdit={() => openEditDialog(team)}
                      onDelete={() => setTeamToDelete(team)}
                    />
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-line-strong px-6 py-14 text-center">
          <p className="font-serif-italic text-[2rem] leading-10">
            No teams yet.
          </p>
          <p className="max-w-[440px] text-[15px] leading-[22px] text-ink-2">
            Teams group people who work together. Projects can belong to a team,
            and its members get access automatically.
          </p>
          {permissions.canCreateTeams ? (
            <Button
              variant="outline"
              className="mt-3"
              onClick={openCreateDialog}
            >
              <PlusIcon className="size-4" />
              New team
            </Button>
          ) : null}
        </div>
      )}

      <TeamDialog
        availableMembers={availableMembers}
        teamId={editingTeamId}
        form={form}
        mode={dialogMode}
        open={dialogOpen}
        saving={saving}
        onChange={setForm}
        onOpenChange={setDialogOpen}
        onSubmit={saveTeam}
      />

      <AlertDialog
        open={Boolean(teamToDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setTeamToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete team?</AlertDialogTitle>
            <AlertDialogDescription>
              {teamToDelete?.name} will be removed from team lists. Members will
              stay in the organization.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={deleteTeam}
            >
              Delete team
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
