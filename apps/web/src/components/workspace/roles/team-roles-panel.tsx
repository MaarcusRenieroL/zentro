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
  principalName: string;
  scopeType: "organization" | "team" | "project";
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
  const canAssignOrg = usePermission("roles.assign");
  const canAssignTeam = usePermission("teams.members.manage", { teamId });
  const [rows, setRows] = useState<Row[]>([]);
  const [roleList, setRoleList] = useState<Role[]>([]);
  const [orgRoleId, setOrgRoleId] = useState("");
  const [memberId, setMemberId] = useState("");
  const [teamRoleId, setTeamRoleId] = useState("");

  const load = useCallback(async () => {
    const [assigned, available] = await Promise.all([
      trpcResult(trpc.permissions.assignments.list.query()),
      trpcResult(trpc.permissions.roles.list.query()),
    ]);

    setRoleList((available.data ?? []) as Role[]);
    setRows(
      (
        (assigned.data ?? []) as Array<
          Row & { principalId: string; scopeId: string }
        >
      ).filter(
        (row) =>
          (row.principalType === "team" && row.principalId === teamId) ||
          (row.scopeType === "team" && row.scopeId === teamId),
      ),
    );
  }, [trpc, teamId]);

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

  const organizationId = roleList[0]?.organizationId ?? "";

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
              {canAssignOrg || canAssignTeam ? (
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

      {canAssignOrg ? (
        <div className="flex gap-2">
          <Select value={orgRoleId} onValueChange={setOrgRoleId}>
            <SelectTrigger aria-label="Role for whole team">
              <SelectValue placeholder="Give the whole team a role" />
            </SelectTrigger>
            <SelectContent>
              {roleList
                .filter((role) => role.scope === "organization")
                .map((role) => (
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
              {roleList
                .filter((role) => role.scope === "team")
                .map((role) => (
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
