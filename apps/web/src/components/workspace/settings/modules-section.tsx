"use client";

import { useTrpcClient } from "@zentro/api/react";
import { Badge } from "@zentro/ui/components/shadcn/badge";
import { Tile, type TileTint } from "@zentro/ui/components/tile";
import { Skeleton } from "@zentro/ui/components/shadcn/skeleton";
import { Switch } from "@zentro/ui/components/shadcn/switch";
import { toastError, toastSuccess } from "@zentro/ui/index";
import { useRouter } from "next/navigation";
import { FC, useCallback, useEffect, useState } from "react";

import { getModuleIcon } from "~/src/lib/module-icons";

const tints: Record<string, TileTint> = {
  dashboard: "tasks",
  settings: "audit",
  projects: "projects",
  tasks: "tasks",
  docs: "docs",
};

type ModuleRow = {
  id: string;
  name: string;
  description: string;
  icon: string;
  core: boolean;
  enabled: boolean;
  canToggle: boolean;
  reason: string | null;
};

type ModuleList = {
  canManage: boolean;
  modules: ModuleRow[];
};

export const ModulesSection: FC = () => {
  const [data, setData] = useState<ModuleList | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const trpc = useTrpcClient();
  const router = useRouter();

  const load = useCallback(async () => {
    try {
      setData(await trpc.modules.list.query());
    } catch {
      toastError("Error", "Could not load modules");
    }
  }, [trpc]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleToggle = async (module: ModuleRow, enabled: boolean) => {
    setSavingId(module.id);

    try {
      await trpc.modules.setEnabled.mutate({ moduleId: module.id, enabled });
      toastSuccess(`${module.name} turned ${enabled ? "on" : "off"}`);
      await load();
      // Re-render the shell so the sidebar reflects the change.
      router.refresh();
    } catch (error) {
      toastError(error, "Could not update module");
      await load();
    } finally {
      setSavingId(null);
    }
  };

  if (!data) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl text-ink">Modules</h2>
        <p className="mt-1 text-sm text-ink-2">
          Choose which parts of Zentro your organization uses. Turning a module
          off hides it but keeps all of its data.
          {data.canManage ? "" : " Only owners and admins can change modules."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {data.modules.map((module) => {
          const Icon = getModuleIcon(module.icon);
          const isSaving = savingId === module.id;
          const tint = tints[module.id] ?? "tasks";

          return (
            <Tile
              key={module.id}
              tint={tint}
              icon={<Icon />}
              title={module.name}
              actions={
                module.core ? (
                  <Badge variant="secondary">Always on</Badge>
                ) : (
                  <Switch
                    aria-label={`${module.name} module`}
                    checked={module.enabled}
                    disabled={!data.canManage || !module.canToggle || isSaving}
                    onCheckedChange={(checked) =>
                      void handleToggle(module, checked)
                    }
                  />
                )
              }
            >
              <p className="text-sm text-ink-2">{module.description}</p>
              {!module.core && module.reason ? (
                <p className="mt-3 rounded-sm bg-sunken px-2.5 py-1.5 text-xs text-ink-2">
                  {module.reason}
                </p>
              ) : null}
            </Tile>
          );
        })}
      </div>
    </div>
  );
};
