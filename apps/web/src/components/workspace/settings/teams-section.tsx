"use client";

import { TeamRolesPanel } from "~/src/components/workspace/roles/team-roles-panel";
import { usePermission } from "~/src/components/permissions/permission-provider";
import { useEffect, useMemo, useState } from "react";
import {
  Edit3Icon,
  PlusIcon,
  SearchIcon,
  ShieldCheckIcon,
  Trash2Icon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react";

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
import { Avatar, AvatarFallback } from "@zentro/ui/components/shadcn/avatar";
import { Badge } from "@zentro/ui/components/shadcn/badge";
import { Button } from "@zentro/ui/components/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@zentro/ui/components/shadcn/card";
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

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

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
                    <Avatar className="size-8">
                      <AvatarFallback className="text-xs">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
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
    <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
      <Button
        variant="outline"
        size="sm"
        disabled={!canUpdate}
        onClick={onEdit}
      >
        <Edit3Icon className="size-4" />
        Edit
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={!canManageMembers}
        onClick={onEdit}
      >
        <UserPlusIcon className="size-4" />
        Members
      </Button>
      <Button
        variant="destructive"
        size="sm"
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
  const [searchQuery, setSearchQuery] = useState("");
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
          tasks: 0,
          docs: 0,
        };
      }

      for (const project of projectList) {
        if (project.teamId) {
          const counts = nextScopeCounts[project.teamId];

          if (counts) {
            counts.projects += 1;
          }
        }
      }

      for (const task of taskList) {
        if (task.teamId) {
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

  const filteredTeams = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    if (!normalizedSearch) {
      return teams;
    }

    return teams.filter((team) =>
      [
        team.name,
        team.description ?? "",
        ...team.members.map((member) => `${member.name} ${member.email}`),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [searchQuery, teams]);

  const totalMemberships = teams.reduce(
    (total, team) => total + team.members.length,
    0,
  );

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-hairline/60 bg-surface text-muted-foreground shadow-sm">
            <ShieldCheckIcon className="size-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Teams</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Group members by function, squad, or ownership area so workspace
              planning stays easier to manage.
            </p>
          </div>
        </div>

        <Button
          disabled={!permissions.canCreateTeams}
          onClick={openCreateDialog}
        >
          <PlusIcon className="size-4" />
          New team
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="rounded-lg">
          <CardContent className="p-4">
            <p className="text-2xl font-semibold">{teams.length}</p>
            <p className="text-sm text-muted-foreground">Teams</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardContent className="p-4">
            <p className="text-2xl font-semibold">{availableMembers.length}</p>
            <p className="text-sm text-muted-foreground">Workspace members</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardContent className="p-4">
            <p className="text-2xl font-semibold">{totalMemberships}</p>
            <p className="text-sm text-muted-foreground">Team assignments</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          value={searchQuery}
          placeholder="Search teams or members..."
          onChange={(event) => setSearchQuery(event.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-52 rounded-lg" />
          ))}
        </div>
      ) : filteredTeams.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredTeams.map((team) => (
            <Card key={team.id} className="rounded-lg">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span
                      className={cn(
                        "mt-1 size-3 shrink-0 rounded-full",
                        getColorClass(team.color),
                      )}
                    />
                    <div className="min-w-0">
                      <CardTitle className="truncate text-base">
                        {team.name}
                      </CardTitle>
                      <CardDescription className="mt-1 line-clamp-2">
                        {team.description || "No description yet."}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {team.members.length} member
                    {team.members.length === 1 ? "" : "s"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex min-h-10 flex-wrap gap-2">
                  {sortMembers(team.members)
                    .slice(0, 6)
                    .map((member) => (
                      <span
                        key={member.id}
                        className="inline-flex items-center gap-2 rounded-xl border border-hairline/60 bg-surface px-2 py-1 text-xs"
                      >
                        <Avatar className="size-5">
                          <AvatarFallback className="text-[10px]">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        {member.name}
                      </span>
                    ))}
                  {!team.members.length ? (
                    <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                      <UsersIcon className="size-4" />
                      No members assigned
                    </span>
                  ) : null}
                  {team.members.length > 6 ? (
                    <Badge variant="outline">+{team.members.length - 6}</Badge>
                  ) : null}
                </div>

                <div className="grid grid-cols-3 gap-2 rounded-md border bg-muted/20 p-2 text-center">
                  <div>
                    <p className="text-sm font-semibold">
                      {scopeCounts[team.id]?.projects ?? 0}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Projects
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">
                      {scopeCounts[team.id]?.tasks ?? 0}
                    </p>
                    <p className="text-[11px] text-muted-foreground">Tasks</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">
                      {scopeCounts[team.id]?.docs ?? 0}
                    </p>
                    <p className="text-[11px] text-muted-foreground">Docs</p>
                  </div>
                </div>

                <TeamActions
                  teamId={team.id}
                  onEdit={() => openEditDialog(team)}
                  onDelete={() => setTeamToDelete(team)}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-14 text-center">
          <ShieldCheckIcon className="mx-auto mb-3 size-10 text-muted-foreground" />
          <p className="text-sm font-medium">
            {searchQuery.trim() ? "No teams found" : "No teams yet"}
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            {searchQuery.trim()
              ? "Try a different team name or member search."
              : "Create your first team to group workspace members by ownership area."}
          </p>
          {!searchQuery.trim() ? (
            <Button
              variant="outline"
              className="mt-4"
              disabled={!permissions.canCreateTeams}
              onClick={openCreateDialog}
            >
              <PlusIcon className="size-4" />
              Create team
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
