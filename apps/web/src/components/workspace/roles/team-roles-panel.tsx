"use client";

import { FC, useCallback, useEffect, useState } from "react";

import { useTrpcClient } from "@zentro/api/react";
import { toastError, toastSuccess } from "@zentro/ui/index";
import { Button } from "@zentro/ui/shadcn/button";
import { Label } from "@zentro/ui/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zentro/ui/shadcn/select";

import { usePermission } from "~/src/components/permissions/permission-provider";
import { trpcResult } from "~/src/lib/trpc-result";

type Row = {
  id: string;
  roleName: string;
  principalType: "user" | "team";
  principalId: string;
  principalName: string;
  scopeType: "organization" | "team" | "project";
  scopeId: string;
  scopeName: string;
};
type Role = {
  id: string;
  name: string;
  scope: string;
  organizationId: string;
};

/** Roles given to a team as a whole, and team roles given to its members. */
export const TeamRolesPanel: FC<{
  teamId: string;
  members: Array<{ userId: string; name: string }>;
}> = ({ teamId, members }) => {
  const trpc = useTrpcClient();
  // Organization-wide rights, for roles that cover the whole team.
  const canViewRoles = usePermission("roles.view");
  const canAssignOrg = usePermission("roles.assign");
  // A team lead holds these for their own team only.
  const canManageTeam = usePermission("teams.members.manage", { teamId });
  const canAssignTeamRoles = usePermission("roles.assign", { teamId });
  const canAssignTeam = canManageTeam || canAssignTeamRoles;
  const [rows, setRows] = useState<Row[]>([]);
  const [teamRoles, setTeamRoles] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [orgRoles, setOrgRoles] = useState<Role[]>([]);
  const [organizationId, setOrganizationId] = useState("");
  const [orgRoleId, setOrgRoleId] = useState("");
  const [memberId, setMemberId] = useState("");
  const [teamRoleId, setTeamRoleId] = useState("");

  const load = useCallback(async () => {
    // Answers from team-level management, so leads need no roles.view.
    const [assigned, available] = await Promise.all([
      trpcResult(trpc.permissions.assignments.listForTeam.query({ teamId })),
      canViewRoles && canAssignOrg
        ? trpcResult(trpc.permissions.roles.list.query())
        : Promise.resolve({ data: null, error: null }),
    ]);

    setTeamRoles(assigned.data?.teamRoles ?? []);
    setRows((assigned.data?.assignments ?? []) as Row[]);

    const organizationRoles = (available.data ?? []) as Role[];

    setOrgRoles(
      organizationRoles.filter((role) => role.scope === "organization"),
    );
    setOrganizationId(organizationRoles[0]?.organizationId ?? "");
  }, [trpc, teamId, canViewRoles, canAssignOrg]);

  useEffect(() => {
    void load();
  }, [load]);

  const run = async (request: Promise<unknown>, message: string) => {
    const { error } = await trpcResult(request);

    if (error) {
      toastError(error.statusText, error.message);

      return;
    }

    toastSuccess(message);
    await load();
  };

  return (
    <div className="space-y-3" data-testid="team-roles-panel">
      <Label>Roles</Label>
      <ul className="divide-y rounded-md border">
        {rows.length ? (
          rows.map((row) => (
            <li
              key={row.id}
              className="flex items-center justify-between px-3 py-2 text-sm"
            >
              <span>
                {row.roleName}{" "}
                <span className="text-muted-foreground">
                  ·{" "}
                  {row.principalType === "team"
                    ? `whole team (${row.scopeName})`
                    : row.principalName}
                </span>
              </span>
              {canAssignTeam || canAssignOrg ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    run(
                      trpc.permissions.assignments.unassign.mutate({
                        assignmentId: row.id,
                      }),
                      "Role removed",
                    )
                  }
                >
                  Remove
                </Button>
              ) : null}
            </li>
          ))
        ) : (
          <li className="px-3 py-3 text-center text-sm text-muted-foreground">
            No roles assigned to this team.
          </li>
        )}
      </ul>

      {canAssignOrg && organizationId ? (
        <div className="flex gap-2">
          <Select value={orgRoleId} onValueChange={setOrgRoleId}>
            <SelectTrigger aria-label="Role for whole team">
              <SelectValue placeholder="Give the whole team a role" />
            </SelectTrigger>
            <SelectContent>
              {orgRoles.map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            disabled={!orgRoleId}
            onClick={() =>
              run(
                trpc.permissions.assignments.assign.mutate({
                  roleId: orgRoleId,
                  principalType: "team",
                  principalId: teamId,
                  scopeType: "organization",
                  scopeId: organizationId,
                }),
                "Role assigned to team",
              ).then(() => setOrgRoleId(""))
            }
          >
            Assign
          </Button>
        </div>
      ) : null}

      {canAssignTeam ? (
        <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
          <Select value={memberId} onValueChange={setMemberId}>
            <SelectTrigger aria-label="Team member">
              <SelectValue placeholder="Team member" />
            </SelectTrigger>
            <SelectContent>
              {members.map((member) => (
                <SelectItem key={member.userId} value={member.userId}>
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={teamRoleId} onValueChange={setTeamRoleId}>
            <SelectTrigger aria-label="Team role">
              <SelectValue placeholder="Team role" />
            </SelectTrigger>
            <SelectContent>
              {teamRoles.map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            disabled={!memberId || !teamRoleId}
            onClick={() =>
              run(
                trpc.permissions.assignments.assign.mutate({
                  roleId: teamRoleId,
                  principalType: "user",
                  principalId: memberId,
                  scopeType: "team",
                  scopeId: teamId,
                }),
                "Team role assigned",
              ).then(() => {
                setMemberId("");
                setTeamRoleId("");
              })
            }
          >
            Assign
          </Button>
        </div>
      ) : null}
    </div>
  );
};
