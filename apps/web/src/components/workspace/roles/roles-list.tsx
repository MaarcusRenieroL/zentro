"use client";

import { FC, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CopyIcon, PlusIcon, Trash2Icon } from "lucide-react";

import { useTrpcClient } from "@zentro/api/react";
import { Badge } from "@zentro/ui/shadcn/badge";
import { Button } from "@zentro/ui/shadcn/button";
import { Card, CardContent } from "@zentro/ui/shadcn/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { useRouter } from "next/navigation";

import { usePermission } from "~/src/components/permissions/permission-provider";
import { paths } from "~/src/lib/paths";
import { trpcResult } from "~/src/lib/trpc-result";

import { PermissionMatrix } from "./permission-matrix";
import { scopeLabels } from "./use-catalog";

type RoleRow = {
  id: string;
  name: string;
  description: string | null;
  scope: string;
  kind: string;
  systemKey: string | null;
  permissions: string[];
  assignmentCount: number;
  editable: boolean;
};

export const RolesList: FC = () => {
  const trpc = useTrpcClient();
  const router = useRouter();
  const [roles, setRoles] = useState<RoleRow[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [cloning, setCloning] = useState<RoleRow | null>(null);
  const [deleting, setDeleting] = useState<RoleRow | null>(null);
  const [name, setName] = useState("");
  const [scope, setScope] = useState<"organization" | "team" | "project">(
    "organization",
  );

  const canCreate = usePermission("roles.create");
  const canUpdate = usePermission("roles.update");
  const canDelete = usePermission("roles.delete");

  const load = useCallback(async () => {
    const { data, error } = await trpcResult(
      trpc.permissions.roles.list.query(),
    );

    if (error) {
      toastError(error.statusText, error.message);
      setRoles([]);

      return;
    }

    setRoles(data as RoleRow[]);
  }, [trpc]);

  useEffect(() => {
    void load();
  }, [load]);

  const createRole = async () => {
    const { data, error } = await trpcResult(
      trpc.permissions.roles.create.mutate({ name, scope, permissions: [] }),
    );

    if (error) {
      toastError(error.statusText, error.message);

      return;
    }

    toastSuccess("Role created");
    setCreating(false);
    setName("");
    router.push(paths.role(data.id));
  };

  const cloneRole = async () => {
    if (!cloning) return;

    const { data, error } = await trpcResult(
      trpc.permissions.roles.clone.mutate({ id: cloning.id, name }),
    );

    if (error) {
      toastError(error.statusText, error.message);

      return;
    }

    toastSuccess("Role cloned");
    setCloning(null);
    setName("");
    router.push(paths.role(data.id));
  };

  const deleteRole = async () => {
    if (!deleting) return;

    const { error } = await trpcResult(
      trpc.permissions.roles.delete.mutate({ id: deleting.id }),
    );

    if (error) {
      toastError(error.statusText, error.message);

      return;
    }

    toastSuccess("Role deleted");
    setDeleting(null);
    await load();
  };

  if (!roles) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl text-ink">Roles</h2>
          <p className="mt-1 text-sm text-ink-2">
            Roles group permissions. Owner is always everything; Admin and
            Member can be adjusted; team and project roles apply where they are
            assigned.
          </p>
        </div>
        {canCreate ? (
          <Button onClick={() => setCreating(true)}>
            <PlusIcon className="size-4" />
            New role
          </Button>
        ) : null}
      </div>

      <Card className="py-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id} data-testid={`role-row-${role.name}`}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Link
                        href={paths.role(role.id)}
                        className="font-medium hover:underline"
                      >
                        {role.name}
                      </Link>
                      {role.kind === "system" ? (
                        <Badge variant="secondary">System</Badge>
                      ) : null}
                    </div>
                    {role.description ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {role.description}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell>{scopeLabels[role.scope] ?? role.scope}</TableCell>
                  <TableCell>{role.permissions.length}</TableCell>
                  <TableCell>
                    {role.systemKey === "admin" ||
                    role.systemKey === "member" ||
                    role.systemKey === "owner"
                      ? "Base role"
                      : role.assignmentCount}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={paths.role(role.id)}>
                          {role.editable && canUpdate ? "Edit" : "View"}
                        </Link>
                      </Button>
                      {canCreate ? (
                        <Button
                          variant="outline"
                          size="icon-sm"
                          aria-label={`Clone ${role.name}`}
                          onClick={() => {
                            setCloning(role);
                            setName(`${role.name} copy`);
                          }}
                        >
                          <CopyIcon className="size-4" />
                        </Button>
                      ) : null}
                      {canDelete && role.kind === "custom" ? (
                        <Button
                          variant="outline"
                          size="icon-sm"
                          aria-label={`Delete ${role.name}`}
                          onClick={() => setDeleting(role)}
                        >
                          <Trash2Icon className="size-4" />
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <PermissionMatrix roles={roles} />

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New role</DialogTitle>
            <DialogDescription>
              Name the role and choose where it can be assigned. You pick its
              permissions next.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="role-name">Name</Label>
              <Input
                id="role-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Viewer plus comment"
              />
            </div>
            <div className="space-y-2">
              <Label>Scope</Label>
              <Select
                value={scope}
                onValueChange={(value) =>
                  setScope(value as "organization" | "team" | "project")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="organization">Organization</SelectItem>
                  <SelectItem value="team">Team</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button disabled={name.trim().length < 2} onClick={createRole}>
              Create role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(cloning)}
        onOpenChange={(open) => !open && setCloning(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clone {cloning?.name}</DialogTitle>
            <DialogDescription>
              The copy starts with the same permissions (owner-only ones are
              left out).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="clone-name">Name</Label>
            <Input
              id="clone-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloning(null)}>
              Cancel
            </Button>
            <Button disabled={name.trim().length < 2} onClick={cloneRole}>
              Clone role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleting?.name}?</DialogTitle>
            <DialogDescription>
              {deleting && deleting.assignmentCount > 0
                ? `This role is assigned ${deleting.assignmentCount} time${deleting.assignmentCount === 1 ? "" : "s"}. Remove those assignments first.`
                : "This cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={Boolean(deleting && deleting.assignmentCount > 0)}
              onClick={deleteRole}
            >
              Delete role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
