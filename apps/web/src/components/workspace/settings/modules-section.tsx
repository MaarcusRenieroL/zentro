"use client";

import { useRouter } from "next/navigation";
import { FC, useCallback, useEffect, useState } from "react";
import { LinkIcon } from "lucide-react";

import { useTrpcClient } from "@zentro/api/react";
import { TintChip, type TileTint } from "@zentro/ui/components/tile";
import { toastError, toastSuccess } from "@zentro/ui/index";
import { cn } from "@zentro/ui/lib/utils";
import { Button } from "@zentro/ui/shadcn/button";
import { Skeleton } from "@zentro/ui/shadcn/skeleton";
import { Switch } from "@zentro/ui/shadcn/switch";

import { getModuleIcon } from "~/src/lib/module-icons";

import { SettingsHeader } from "./settings-kit";

const tints: Record<string, string> = {
  dashboard: "bg-tint-tasks",
  settings: "bg-tint-audit",
  projects: "bg-tint-projects",
  tasks: "bg-tint-tasks",
  docs: "bg-tint-docs",
};

// One line on every card about what it needs or what needs it.
const dependencyLine: Record<string, string> = {
  projects: "Used by Tasks",
  tasks: "Needs Projects",
  docs: "Works alone",
  dashboard: "Always on",
  settings: "Always on",
};

// Planned modules: named, dashed, never toggleable.
const planned: Array<{ name: string; description: string; tint: TileTint }> = [
  {
    name: "Files",
    description: "Store a file once and attach it anywhere.",
    tint: "projects",
  },
  {
    name: "Chat",
    description: "Channels and threads next to the work.",
    tint: "teams",
  },
  {
    name: "Meetings",
    description: "Agendas and notes that turn into tasks.",
    tint: "docs",
  },
  {
    name: "Calendar",
    description: "Team calendars tied to due dates.",
    tint: "tasks",
  },
  {
    name: "Dashboards",
    description: "Charts built from your projects and tasks.",
    tint: "audit",
  },
  {
    name: "Forms",
    description: "Collect requests that turn into tasks.",
    tint: "sun",
  },
  {
    name: "Tickets",
    description: "Support requests linked to the tasks that fix them.",
    tint: "lilac",
  },
  {
    name: "HR",
    description: "Employee records, time off and onboarding.",
    tint: "teams",
  },
  {
    name: "Payroll",
    description: "Run pay from the same employee records.",
    tint: "slate",
  },
];

const plannedTint: Record<TileTint, string> = {
  projects: "bg-tint-projects",
  tasks: "bg-tint-tasks",
  docs: "bg-tint-docs",
  teams: "bg-tint-teams",
  audit: "bg-tint-audit",
  sun: "bg-tint-sun",
  lilac: "bg-tint-lilac",
  slate: "bg-tint-slate",
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
  // Turning Projects off while Tasks is on asks first.
  const [warn, setWarn] = useState(false);
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

  const setEnabled = async (module: ModuleRow, enabled: boolean) => {
    await trpc.modules.setEnabled.mutate({ moduleId: module.id, enabled });
  };

  const handleToggle = async (module: ModuleRow, enabled: boolean) => {
    const tasks = data?.modules.find((row) => row.id === "tasks");

    if (module.id === "projects" && !enabled && tasks?.enabled) {
      setWarn(true);
      return;
    }

    setSavingId(module.id);

    try {
      await setEnabled(module, enabled);
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

  const turnOffBoth = async () => {
    const tasks = data?.modules.find((row) => row.id === "tasks");
    const projects = data?.modules.find((row) => row.id === "projects");

    if (!tasks || !projects) return;

    setSavingId("projects");

    try {
      // Dependents first, so Projects is never off under a running Tasks.
      await setEnabled(tasks, false);
      await setEnabled(projects, false);
      toastSuccess("Tasks and Projects turned off");
      setWarn(false);
      await load();
      router.refresh();
    } catch (error) {
      toastError(error, "Could not turn them off");
      await load();
    } finally {
      setSavingId(null);
    }
  };

  if (!data) {
    return (
      <div className="flex flex-col gap-6">
        <SettingsHeader eyebrow="ACCESS" title="Modules" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <SettingsHeader
        eyebrow="ACCESS"
        title="Modules"
        description={`Turn modules on or off for everyone in your organization. Turning one off hides it but keeps its data, so you can turn it back on later.${data.canManage ? "" : " Only owners and admins can change modules."}`}
      />

      <div className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data.modules.map((module) => {
          const Icon = getModuleIcon(module.icon);
          const isSaving = savingId === module.id;
          const showWarn = warn && module.id === "projects";
          // Projects stays clickable while Tasks needs it: that is what opens
          // the warning, rather than a dead switch.
          const askFirst =
            module.id === "projects" &&
            Boolean(data.modules.find((row) => row.id === "tasks")?.enabled);

          return (
            <div key={module.id} className="contents">
              <section
                className={cn(
                  "tile overflow-hidden",
                  !module.enabled && !module.core && "opacity-80",
                )}
              >
                <header
                  className={cn(
                    "flex items-center gap-2.5 px-4 py-3.5",
                    tints[module.id] ?? "bg-tint-tasks",
                  )}
                >
                  <TintChip className="size-7 rounded-md">
                    <Icon aria-hidden="true" />
                  </TintChip>
                  <h2 className="text-base font-semibold">{module.name}</h2>
                  {module.enabled && !module.core ? (
                    <span className="rounded-full bg-tint-chip px-2 py-0.5 font-mono text-[11px]">
                      ● Live
                    </span>
                  ) : null}
                  <span className="flex-1" />
                  {module.core ? (
                    <span className="font-mono text-[11px] text-ink-2">
                      Always on
                    </span>
                  ) : (
                    <Switch
                      aria-label={`${module.name} module`}
                      checked={module.enabled}
                      disabled={
                        !data.canManage ||
                        (!module.canToggle && !askFirst) ||
                        isSaving
                      }
                      onCheckedChange={(checked) =>
                        void handleToggle(module, checked)
                      }
                    />
                  )}
                </header>
                <div className="flex flex-col gap-2.5 px-[18px] pt-3.5 pb-[18px]">
                  <p className="text-sm leading-5 text-ink-2">
                    {module.description}
                  </p>
                  <p className="flex items-center gap-2 font-mono text-xs text-ink-2">
                    <LinkIcon className="size-3.5" aria-hidden="true" />
                    {dependencyLine[module.id] ?? "Works alone"}
                  </p>
                  {!module.core && module.reason && !askFirst ? (
                    <p className="rounded-sm bg-sunken px-2.5 py-1.5 text-xs text-ink-2">
                      {module.reason}
                    </p>
                  ) : null}
                </div>
              </section>

              {showWarn ? (
                <div
                  role="alert"
                  className="flex gap-3 rounded-xl border border-warning/50 bg-warning-subtle/60 p-3.5 sm:col-span-2 xl:col-span-3"
                >
                  <span
                    aria-hidden="true"
                    className="flex size-[22px] flex-none items-center justify-center rounded-full border-[1.5px] border-warning font-mono text-xs font-semibold text-warning-text"
                  >
                    !
                  </span>
                  <div className="flex flex-col gap-3">
                    <p className="text-sm leading-5">
                      <strong className="font-semibold">
                        Tasks needs Projects.
                      </strong>{" "}
                      <span className="text-ink-2">
                        Every task belongs to a project. Turn off Tasks first,
                        or keep Projects on.
                      </span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setWarn(false)}
                      >
                        Keep Projects on
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        loading={isSaving}
                        onClick={turnOffBoth}
                      >
                        Turn off both
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <section aria-labelledby="coming-title" className="flex flex-col gap-3.5">
        <div className="flex items-baseline gap-2.5 pt-4">
          <h2 id="coming-title" className="text-[15px] font-semibold">
            Coming
          </h2>
          <span className="font-mono text-xs text-ink-3">
            {planned.length} planned · not available yet
          </span>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {planned.map((item) => (
            <li
              key={item.name}
              className="flex flex-col gap-1.5 rounded-xl border border-dashed border-hairline px-4 py-3.5 opacity-55"
            >
              <div className="flex items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className={cn(
                    "size-6 rounded-md border border-hairline",
                    plannedTint[item.tint],
                  )}
                />
                <span className="text-[15px] font-semibold">{item.name}</span>
                <span className="flex-1" />
                <span className="rounded-full border border-dashed border-ink-3 px-2 py-px font-mono text-[11px] text-ink-2">
                  Coming
                </span>
              </div>
              <p className="text-[13px] leading-5 text-ink-2">
                {item.description}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};
