"use client";

import { FC, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon, SearchIcon } from "lucide-react";

import { useTrpcClient } from "@zentro/api/react";
import { listModules } from "@zentro/modules";
import { Badge } from "@zentro/ui/shadcn/badge";
import { Button } from "@zentro/ui/shadcn/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@zentro/ui/shadcn/card";
import { Input } from "@zentro/ui/shadcn/input";
import { Label } from "@zentro/ui/shadcn/label";
import { Skeleton } from "@zentro/ui/shadcn/skeleton";
import { Switch } from "@zentro/ui/shadcn/switch";
import { Textarea } from "@zentro/ui/shadcn/textarea";
import { toastError, toastSuccess } from "@zentro/ui/index";

import {
  usePermission,
  usePermissionMap,
} from "~/src/components/permissions/permission-provider";
import { paths } from "~/src/lib/paths";
import { trpcResult } from "~/src/lib/trpc-result";

import { scopeLabels, useCatalog } from "./use-catalog";

type Role = {
  id: string;
  name: string;
  description: string | null;
  scope: "organization" | "team" | "project";
  kind: "system" | "custom";
  systemKey: string | null;
  permissions: string[];
};

const moduleNames: Record<string, string> = {
  platform: "Platform",
  ...Object.fromEntries(
    listModules().map((module) => [module.id, module.name]),
  ),
};

export const RoleEditor: FC<{ roleId: string }> = ({ roleId }) => {
  const trpc = useTrpcClient();
  const catalog = useCatalog();
  const myPermissions = usePermissionMap();
  const canUpdate = usePermission("roles.update");
  const [role, setRole] = useState<Role | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await trpcResult(
      trpc.permissions.roles.get.query({ id: roleId }),
    );

    if (error) {
      toastError(error.statusText, error.message);

      return;
    }

    const loaded = data as Role;

    setRole(loaded);
    setName(loaded.name);
    setDescription(loaded.description ?? "");
    setSelected(new Set(loaded.permissions));
  }, [roleId, trpc]);

  useEffect(() => {
    void load();
  }, [load]);

  const isBaseRole =
    role?.systemKey === "admin" || role?.systemKey === "member";
  const editableRole = role?.kind === "custom" || isBaseRole;
  // You can only edit a role whose permissions you all hold yourself.
  const holdsAll = role
    ? role.permissions.every((key) => myPermissions[key])
    : false;
  const canEdit = Boolean(canUpdate && editableRole && holdsAll);

  const groups = useMemo(() => {
    if (!catalog || !role) return [];

    const term = search.trim().toLowerCase();
    const visible = catalog.filter(
      (entry) =>
        entry.enabled &&
        (!term ||
          `${entry.label} ${entry.description} ${entry.key}`
            .toLowerCase()
            .includes(term)),
    );
    const byModule = new Map<string, Map<string, typeof visible>>();

    for (const entry of visible) {
      const groupsOfModule = byModule.get(entry.module) ?? new Map();
      groupsOfModule.set(entry.group, [
        ...(groupsOfModule.get(entry.group) ?? []),
        entry,
      ]);
      byModule.set(entry.module, groupsOfModule);
    }

    return [...byModule.entries()];
  }, [catalog, role, search]);

  const save = async () => {
    if (!role) return;

    setSaving(true);

    const { error } = await trpcResult(
      trpc.permissions.roles.update.mutate({
        id: role.id,
        ...(isBaseRole ? {} : { name, description }),
        permissions: [...selected],
      }),
    );

    setSaving(false);

    if (error) {
      toastError(error.statusText, error.message);

      return;
    }

    toastSuccess("Role saved");
    await load();
  };

  const reset = async () => {
    if (!role || !isBaseRole) return;

    const { error } = await trpcResult(
      trpc.permissions.roles.resetSystem.mutate({
        systemKey: role.systemKey as "admin" | "member",
      }),
    );

    if (error) {
      toastError(error.statusText, error.message);

      return;
    }

    toastSuccess("Role reset to its defaults");
    await load();
  };

  if (!role || !catalog) {
    return <Skeleton className="h-96 w-full" />;
  }

  const dirty =
    name !== role.name ||
    description !== (role.description ?? "") ||
    selected.size !== role.permissions.length ||
    role.permissions.some((key) => !selected.has(key));

  return (
    <div className="space-y-4">
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link href={paths.rolesSettings()}>
          <ArrowLeftIcon className="size-4" />
          All roles
        </Link>
      </Button>

      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold text-foreground">{role.name}</h2>
        {role.kind === "system" ? (
          <Badge variant="secondary">System</Badge>
        ) : null}
        <Badge variant="outline">{scopeLabels[role.scope]} role</Badge>
      </div>

      {role.systemKey === "owner" ? (
        <p className="text-sm text-muted-foreground">
          Owner always has every permission and cannot be changed.
        </p>
      ) : !editableRole ? (
        <p className="text-sm text-muted-foreground">
          This system role cannot be changed.
        </p>
      ) : !canUpdate ? (
        <p className="text-sm text-muted-foreground">
          You can view this role but not change it.
        </p>
      ) : !holdsAll ? (
        <p className="text-sm text-muted-foreground">
          This role grants permissions you do not hold yourself, so you cannot
          edit it.
        </p>
      ) : null}

      {!isBaseRole && role.kind === "custom" ? (
        <Card>
          <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="role-title">Name</Label>
              <Input
                id="role-title"
                value={name}
                disabled={!canEdit}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-description">Description</Label>
              <Textarea
                id="role-description"
                rows={2}
                value={description}
                disabled={!canEdit}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="relative">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="Search permissions"
          placeholder="Search permissions"
          className="pl-9"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {groups.map(([moduleId, groupMap]) => (
        <Card key={moduleId}>
          <CardHeader>
            <CardTitle className="text-base">
              {moduleNames[moduleId] ?? moduleId}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {[...groupMap.entries()].map(([group, entries]) => (
              <div key={group} className="space-y-2">
                <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  {group}
                </h3>
                <div className="divide-y rounded-md border">
                  {entries.map((entry) => {
                    const allowedHere = entry.scopes.includes(role.scope);
                    const held = Boolean(myPermissions[entry.key]);
                    const isOn = selected.has(entry.key);
                    const locked =
                      !canEdit ||
                      entry.ownerOnly ||
                      !allowedHere ||
                      (!held && !isOn);

                    return (
                      <div
                        key={entry.key}
                        className="flex items-center justify-between gap-4 px-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium">
                            {entry.label}
                            {entry.ownerOnly ? (
                              <Badge variant="outline" className="ml-2">
                                Owner only
                              </Badge>
                            ) : null}
                            {!allowedHere && !entry.ownerOnly ? (
                              <Badge variant="outline" className="ml-2">
                                Not for {role.scope} roles
                              </Badge>
                            ) : null}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {entry.description}
                          </p>
                        </div>
                        <Switch
                          aria-label={entry.label}
                          checked={role.systemKey === "owner" || isOn}
                          disabled={locked || role.systemKey === "owner"}
                          onCheckedChange={(checked) =>
                            setSelected((current) => {
                              const next = new Set(current);

                              if (checked) next.add(entry.key);
                              else next.delete(entry.key);

                              return next;
                            })
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {canEdit ? (
        <div className="flex flex-wrap gap-2">
          <Button disabled={!dirty || saving} onClick={save}>
            Save changes
          </Button>
          {isBaseRole ? (
            <Button variant="outline" onClick={reset}>
              Reset to default
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};
