"use client";

import { FC, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  CopyIcon,
  LockIcon,
  MoreHorizontalIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";

import { useTrpcClient } from "@zentro/api/react";
import { Button } from "@zentro/ui/shadcn/button";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@zentro/ui/shadcn/dropdown-menu";
import { toastError, toastSuccess } from "@zentro/ui/index";
import { useRouter } from "next/navigation";

import { ActorAvatar } from "~/src/components/actor-avatar";
import { usePermission } from "~/src/components/permissions/permission-provider";
import { useFrameAction } from "~/src/components/workspace/settings/frames";
import { paths } from "~/src/lib/paths";
import { trpcResult } from "~/src/lib/trpc-result";

import { PermissionMatrix } from "./permission-matrix";
import { roleOrder, scopeLabels, useCatalog } from "./use-catalog";

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

  const catalog = useCatalog();
  const [members, setMembers] = useState<
    Array<{ userId: string; name: string; role: string }>
  >([]);
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

    setRoles([...(data as RoleRow[])].sort(roleOrder));
  }, [trpc]);

  useEffect(() => {
    void load();
  }, [load]);

  // Base roles count people by their membership; who holds them shows here.
  useEffect(() => {
    trpc.member.getMembers
      .query()
      .then((list) =>
        setMembers(
          list.map((member) => ({
            userId: member.userId,
            name: member.name,
            role: member.role,
          })),
        ),
      )
      .catch(() => setMembers([]));
  }, [trpc]);

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

  const startCreate = () => setCreating(true);
  const framedAction = useFrameAction(
    canCreate ? "New role" : null,
    startCreate,
  );

  if (!roles) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  const totalFor = (scope: string) =>
    catalog?.filter((entry) => entry.scopes.includes(scope)).length ?? 0;
  const peopleFor = (role: RoleRow) =>
    role.systemKey === "owner" ||
    role.systemKey === "admin" ||
    role.systemKey === "member"
      ? members.filter((member) => member.role === role.systemKey)
      : null;

  return (
    <div className="flex flex-col gap-8">
      {!framedAction && canCreate ? (
        <div className="flex justify-end">
          <Button onClick={startCreate}>
            <PlusIcon className="size-4" />
            New role
          </Button>
        </div>
      ) : null}

      <div role="table" aria-label="Roles" className="flex flex-col">
        <div
          role="row"
          className="flex h-9 items-center gap-3 border-b border-hairline px-3 font-mono text-[11px] tracking-[0.08em] text-ink-3 uppercase"
        >
          <span role="columnheader" className="min-w-0 flex-1">
            Role
          </span>
          <span role="columnheader" className="hidden w-36 sm:block">
            People
          </span>
          <span role="columnheader" className="w-24 text-right">
            Permissions
          </span>
          <span role="columnheader" className="w-8">
            <span className="sr-only">Actions</span>
          </span>
        </div>
        {roles.map((role) => {
          const people = peopleFor(role);
          const count = people ? people.length : role.assignmentCount;
          const total = totalFor(role.scope);
          const granted =
            role.systemKey === "owner" ? total : role.permissions.length;
          const canClone = canCreate;
          const canRemove = canDelete && role.kind === "custom";

          return (
            <div
              role="row"
              key={role.id}
              data-testid={`role-row-${role.name}`}
              className="relative flex min-h-[63px] items-center gap-3 border-b border-hairline/60 px-3 py-2 hover:bg-hover"
            >
              <span
                role="cell"
                className="flex min-w-0 flex-1 flex-col gap-0.5"
              >
                <span className="flex flex-wrap items-center gap-2">
                  <Link
                    href={paths.role(role.id)}
                    className="text-[15px] font-medium outline-none after:absolute after:inset-0 focus-visible:after:ring-2 focus-visible:after:ring-ring"
                  >
                    {role.name}
                  </Link>
                  <span className="inline-flex items-center gap-1 rounded-xs border border-hairline px-1.5 font-mono text-[10px] tracking-[0.04em] text-ink-2 uppercase">
                    {role.kind === "system" ? (
                      <LockIcon className="size-2.5" aria-hidden="true" />
                    ) : null}
                    {role.kind === "system" ? "System" : "Custom"}
                  </span>
                  {role.scope !== "organization" ? (
                    <span className="font-mono text-[11px] text-ink-3">
                      {scopeLabels[role.scope] ?? role.scope} role
                    </span>
                  ) : null}
                </span>
                {role.description ? (
                  <span className="text-sm text-ink-2">{role.description}</span>
                ) : null}
              </span>
              <span
                role="cell"
                className="hidden w-36 items-center gap-2 sm:flex"
              >
                {people?.length ? (
                  <span className="flex">
                    {people.slice(0, 3).map((member) => (
                      <span
                        key={member.userId}
                        title={member.name}
                        className="-ml-1.5 rounded-full ring-2 ring-canvas first:ml-0"
                      >
                        <ActorAvatar name={member.name} size={22} />
                      </span>
                    ))}
                  </span>
                ) : null}
                <span className="font-mono text-xs text-ink-2">{count}</span>
              </span>
              <span
                role="cell"
                className="w-24 text-right font-mono text-sm text-ink-2"
              >
                {granted} / {total}
              </span>
              <span role="cell" className="relative z-[1] flex w-8 justify-end">
                {canClone || canRemove ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Actions for ${role.name}`}
                      >
                        <MoreHorizontalIcon className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem asChild>
                        <Link href={paths.role(role.id)}>
                          {role.editable && canUpdate ? "Edit" : "View"}
                        </Link>
                      </DropdownMenuItem>
                      {canClone ? (
                        <DropdownMenuItem
                          onClick={() => {
                            setCloning(role);
                            setName(`${role.name} copy`);
                          }}
                        >
                          <CopyIcon className="size-4" />
                          Clone {role.name}
                        </DropdownMenuItem>
                      ) : null}
                      {canRemove ? (
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeleting(role)}
                        >
                          <Trash2Icon className="size-4" />
                          Delete {role.name}
                        </DropdownMenuItem>
                      ) : null}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}
              </span>
            </div>
          );
        })}
      </div>

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
