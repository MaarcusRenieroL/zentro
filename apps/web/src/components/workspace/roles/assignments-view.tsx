"use client";

import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { Trash2Icon } from "lucide-react";

import { useTrpcClient } from "@zentro/api/react";
import { Button } from "@zentro/ui/shadcn/button";
import {
  Card,
  CardContent,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@zentro/ui/shadcn/table";
import { toastError, toastSuccess } from "@zentro/ui/index";

import { usePermission } from "~/src/components/permissions/permission-provider";
import { trpcResult } from "~/src/lib/trpc-result";

import { scopeLabels } from "./use-catalog";

type Option = { id: string; label: string };

type AssignmentRow = {
  id: string;
  roleName: string;
  principalType: "user" | "team";
  principalName: string;
  scopeType: "organization" | "team" | "project";
  scopeId: string;
  scopeName: string;
};

type RoleOption = {
  id: string;
  name: string;
  scope: string;
  systemKey: string | null;
};

export const AssignmentsView: FC = () => {
  const trpc = useTrpcClient();
  const canAssign = usePermission("roles.assign");
  const [rows, setRows] = useState<AssignmentRow[] | null>(null);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [people, setPeople] = useState<Option[]>([]);
  const [teams, setTeams] = useState<Option[]>([]);
  const [projects, setProjects] = useState<Option[]>([]);

  const [roleId, setRoleId] = useState("");
  const [principalType, setPrincipalType] = useState<"user" | "team">("user");
  const [principalId, setPrincipalId] = useState("");
  const [scopeId, setScopeId] = useState("");
  const [organizationId, setOrganizationId] = useState("");

  const load = useCallback(async () => {
    const [assignments, roleList, memberList, teamList, projectList] =
      await Promise.all([
        trpcResult(trpc.permissions.assignments.list.query()),
        trpcResult(trpc.permissions.roles.list.query()),
        trpcResult(trpc.member.getMembers.query()),
        trpcResult(trpc.team.getAll.query()),
        trpcResult(trpc.project.getProjectsByOrgId.query()),
      ]);

    setRows((assignments.data ?? []) as AssignmentRow[]);
    setRoles(
      ((roleList.data ?? []) as RoleOption[]).filter(
        (role) => !["owner", "admin", "member"].includes(role.systemKey ?? ""),
      ),
    );
    setPeople(
      (memberList.data ?? []).map((member) => ({
        id: member.userId,
        label: member.name || member.email,
      })),
    );
    setTeams(
      (teamList.data ?? []).map((team) => ({ id: team.id, label: team.name })),
    );
    setProjects(
      (projectList.data ?? []).map((project) => ({
        id: project.id,
        label: project.name,
      })),
    );
    // The organization id is the scope of organization-level assignments.
    setOrganizationId(roleList.data?.[0]?.organizationId ?? "");
  }, [trpc]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedRole = roles.find((role) => role.id === roleId);
  const scopeOptions = useMemo(() => {
    if (selectedRole?.scope === "team") return teams;
    if (selectedRole?.scope === "project") return projects;

    return [];
  }, [selectedRole, teams, projects]);

  const assign = async () => {
    if (!selectedRole) return;

    const resolvedScopeId =
      selectedRole.scope === "organization" ? organizationId : scopeId;

    const { error } = await trpcResult(
      trpc.permissions.assignments.assign.mutate({
        roleId,
        principalType,
        principalId,
        scopeType: selectedRole.scope as "organization" | "team" | "project",
        scopeId: resolvedScopeId,
      }),
    );

    if (error) {
      toastError(error.statusText, error.message);

      return;
    }

    toastSuccess("Role assigned");
    await load();
  };

  const unassign = async (id: string) => {
    const { error } = await trpcResult(
      trpc.permissions.assignments.unassign.mutate({ assignmentId: id }),
    );

    if (error) {
      toastError(error.statusText, error.message);

      return;
    }

    toastSuccess("Assignment removed");
    await load();
  };

  if (!rows) {
    return <Skeleton className="h-64 w-full" />;
  }

  const principals = principalType === "user" ? people : teams;
  const ready =
    roleId &&
    principalId &&
    (selectedRole?.scope === "organization" || scopeId);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[15px] text-ink-2">
          Who has which role, and where. Base roles (Owner, Admin, Member) are
          set on the members page.
        </p>
      </div>

      {canAssign ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Assign a role</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={roleId}
                onValueChange={(value) => {
                  setRoleId(value);
                  setScopeId("");
                }}
              >
                <SelectTrigger aria-label="Role">
                  <SelectValue placeholder="Choose a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name} ({scopeLabels[role.scope]})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Assign to</Label>
              <Select
                value={principalType}
                onValueChange={(value) => {
                  setPrincipalType(value as "user" | "team");
                  setPrincipalId("");
                }}
              >
                <SelectTrigger aria-label="Principal type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">A member</SelectItem>
                  <SelectItem value="team">A team</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{principalType === "user" ? "Member" : "Team"}</Label>
              <Select value={principalId} onValueChange={setPrincipalId}>
                <SelectTrigger aria-label="Principal">
                  <SelectValue placeholder="Choose" />
                </SelectTrigger>
                <SelectContent>
                  {principals.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedRole && selectedRole.scope !== "organization" ? (
              <div className="space-y-2">
                <Label>{scopeLabels[selectedRole.scope]}</Label>
                <Select value={scopeId} onValueChange={setScopeId}>
                  <SelectTrigger aria-label="Scope">
                    <SelectValue placeholder="Choose" />
                  </SelectTrigger>
                  <SelectContent>
                    {scopeOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <div className="md:col-span-4">
              <Button disabled={!ready} onClick={assign}>
                Assign role
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="py-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Who</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Where</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length ? (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      {row.principalName}{" "}
                      <span className="text-xs text-muted-foreground">
                        ({row.principalType === "team" ? "team" : "member"})
                      </span>
                    </TableCell>
                    <TableCell>{row.roleName}</TableCell>
                    <TableCell>
                      {scopeLabels[row.scopeType]}: {row.scopeName}
                    </TableCell>
                    <TableCell className="text-right">
                      {canAssign ? (
                        <Button
                          variant="outline"
                          size="icon-sm"
                          aria-label={`Remove ${row.roleName} from ${row.principalName}`}
                          onClick={() => unassign(row.id)}
                        >
                          <Trash2Icon className="size-4" />
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    No role assignments yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
