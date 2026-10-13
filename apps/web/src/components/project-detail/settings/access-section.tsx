"use client";

import { FC, useCallback, useEffect, useState } from "react";

import { useTrpcClient } from "@zentro/api/react";
import { toastError, toastSuccess } from "@zentro/ui/index";
import { Button } from "@zentro/ui/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@zentro/ui/shadcn/card";
import { Label } from "@zentro/ui/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zentro/ui/shadcn/select";
import { Skeleton } from "@zentro/ui/shadcn/skeleton";

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

const visibilityLabels: Record<Visibility, string> = {
  organization: "Everyone in the organization",
  team: "Only the owning team and people added below",
  private: "Only people and teams added below",
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Visibility</CardTitle>
          <CardDescription>
            Choose who can see this project and everything in it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Who can see this project</Label>
            <Select
              value={visibility}
              onValueChange={(value) => setVisibility(value as Visibility)}
              disabled={!canManage}
            >
              <SelectTrigger
                aria-label="Project visibility"
                className="max-w-md"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(visibilityLabels) as Visibility[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {visibilityLabels[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Owning team</Label>
            <Select
              value={teamId}
              onValueChange={setTeamId}
              disabled={!canManage}
            >
              <SelectTrigger aria-label="Owning team" className="max-w-md">
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
          </div>
          {canManage ? (
            <Button onClick={saveVisibility}>Save visibility</Button>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Members and roles</CardTitle>
          <CardDescription>
            Give people or teams a role on this project only.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="divide-y rounded-md border">
            {access.assignments.length ? (
              access.assignments.map((assignment) => (
                <li
                  key={assignment.id}
                  className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                >
                  <span>
                    <span className="font-medium">
                      {assignment.principalName}
                    </span>{" "}
                    <span className="text-muted-foreground">
                      ({assignment.principalType}) · {assignment.roleName}
                    </span>
                  </span>
                  {canAssign ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => unassign(assignment.id)}
                    >
                      Remove
                    </Button>
                  ) : null}
                </li>
              ))
            ) : (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                No project-specific roles yet.
              </li>
            )}
          </ul>

          {canAssign ? (
            <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
              <Select value={principal} onValueChange={setPrincipal}>
                <SelectTrigger aria-label="Person or team">
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
                <SelectTrigger aria-label="Project role">
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
              <Button disabled={!principal || !roleId} onClick={assign}>
                Add
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
};
