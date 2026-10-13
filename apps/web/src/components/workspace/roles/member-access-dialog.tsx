"use client";

import { FC, useCallback, useEffect, useState } from "react";

import { useTrpcClient } from "@zentro/api/react";
import { toastError, toastSuccess } from "@zentro/ui/index";
import { Badge } from "@zentro/ui/shadcn/badge";
import { Button } from "@zentro/ui/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@zentro/ui/shadcn/dialog";
import { Input } from "@zentro/ui/shadcn/input";
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

import { useCatalog } from "./use-catalog";

type Props = {
  userId: string;
  name: string;
  baseRole: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type Assignment = {
  id: string;
  roleName: string;
  scopeType: string;
  scopeName: string;
};

type Override = {
  id: string;
  permission: string;
  effect: "allow" | "deny";
  scopeType: string;
  reason: string | null;
};

type RoleOption = {
  id: string;
  name: string;
  scope: string;
  organizationId: string;
};

export const MemberAccessDialog: FC<Props> = ({
  userId,
  name,
  baseRole,
  open,
  onOpenChange,
}) => {
  const trpc = useTrpcClient();
  const catalog = useCatalog();
  const canAssign = usePermission("roles.assign");
  const canOverride = usePermission("permissions.overrides.manage");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [orgRoles, setOrgRoles] = useState<RoleOption[]>([]);
  const [roleId, setRoleId] = useState("");
  const [permission, setPermission] = useState("");
  const [effect, setEffect] = useState<"allow" | "deny">("deny");
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    const [assignmentResult, overrideResult, roleResult] = await Promise.all([
      trpcResult(trpc.permissions.assignments.list.query({ userId })),
      trpcResult(trpc.permissions.overrides.list.query({ userId })),
      trpcResult(trpc.permissions.roles.list.query()),
    ]);

    setAssignments((assignmentResult.data ?? []) as Assignment[]);
    setOverrides((overrideResult.data ?? []) as Override[]);
    setOrgRoles(
      ((roleResult.data ?? []) as RoleOption[]).filter(
        (role) => role.scope === "organization",
      ),
    );
  }, [trpc, userId]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  const run = async (
    request: Promise<unknown>,
    successMessage: string,
  ): Promise<void> => {
    const { error } = await trpcResult(request);

    if (error) {
      toastError(error.statusText, error.message);

      return;
    }

    toastSuccess(successMessage);
    await load();
  };

  const organizationId = orgRoles[0]?.organizationId ?? "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Access for {name}</DialogTitle>
          <DialogDescription>
            Base role: <Badge variant="outline">{baseRole}</Badge>. Extra roles
            add permissions; overrides allow or deny one permission.
          </DialogDescription>
        </DialogHeader>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Additional roles</h3>
          <ul className="divide-y rounded-md border">
            {assignments.length ? (
              assignments.map((assignment) => (
                <li
                  key={assignment.id}
                  className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                >
                  <span>
                    {assignment.roleName}{" "}
                    <span className="text-muted-foreground">
                      · {assignment.scopeName}
                    </span>
                  </span>
                  {canAssign ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        run(
                          trpc.permissions.assignments.unassign.mutate({
                            assignmentId: assignment.id,
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
              <li className="px-3 py-4 text-center text-sm text-muted-foreground">
                No additional roles.
              </li>
            )}
          </ul>
          {canAssign ? (
            <div className="flex gap-2">
              <Select value={roleId} onValueChange={setRoleId}>
                <SelectTrigger aria-label="Role to add">
                  <SelectValue placeholder="Add a role" />
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
                disabled={!roleId}
                onClick={() =>
                  run(
                    trpc.permissions.assignments.assign.mutate({
                      roleId,
                      principalType: "user",
                      principalId: userId,
                      scopeType: "organization",
                      scopeId: organizationId,
                    }),
                    "Role assigned",
                  ).then(() => setRoleId(""))
                }
              >
                Add role
              </Button>
            </div>
          ) : null}
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Permission overrides</h3>
          <ul className="divide-y rounded-md border">
            {overrides.length ? (
              overrides.map((override) => (
                <li
                  key={override.id}
                  className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                >
                  <span>
                    <Badge
                      variant={
                        override.effect === "deny" ? "destructive" : "default"
                      }
                    >
                      {override.effect}
                    </Badge>{" "}
                    {override.permission}
                    {override.reason ? (
                      <span className="text-muted-foreground">
                        {" "}
                        · {override.reason}
                      </span>
                    ) : null}
                  </span>
                  {canOverride ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        run(
                          trpc.permissions.overrides.remove.mutate({
                            id: override.id,
                          }),
                          "Override removed",
                        )
                      }
                    >
                      Remove
                    </Button>
                  ) : null}
                </li>
              ))
            ) : (
              <li className="px-3 py-4 text-center text-sm text-muted-foreground">
                No overrides.
              </li>
            )}
          </ul>
          {canOverride ? (
            <div className="grid gap-2 md:grid-cols-[1fr_8rem]">
              <Select value={permission} onValueChange={setPermission}>
                <SelectTrigger aria-label="Permission to override">
                  <SelectValue placeholder="Permission" />
                </SelectTrigger>
                <SelectContent>
                  {(catalog ?? [])
                    .filter((entry) => entry.enabled && !entry.ownerOnly)
                    .map((entry) => (
                      <SelectItem key={entry.key} value={entry.key}>
                        {entry.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Select
                value={effect}
                onValueChange={(value) => setEffect(value as "allow" | "deny")}
              >
                <SelectTrigger aria-label="Override effect">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="allow">Allow</SelectItem>
                  <SelectItem value="deny">Deny</SelectItem>
                </SelectContent>
              </Select>
              <div className="space-y-1 md:col-span-2">
                <Label htmlFor="override-reason">Reason (optional)</Label>
                <Input
                  id="override-reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                />
              </div>
              <Button
                className="md:col-span-2"
                disabled={!permission || !organizationId}
                onClick={() =>
                  run(
                    trpc.permissions.overrides.set.mutate({
                      userId,
                      permission,
                      effect,
                      scopeType: "organization",
                      scopeId: organizationId,
                      reason: reason || undefined,
                    }),
                    "Override saved",
                  ).then(() => {
                    setPermission("");
                    setReason("");
                  })
                }
              >
                Save override
              </Button>
            </div>
          ) : null}
        </section>
      </DialogContent>
    </Dialog>
  );
};
