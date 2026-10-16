"use client";

import { FC, useEffect, useState } from "react";
import {
  AlertTriangleIcon,
  BotIcon,
  CheckCircle2Icon,
  ClockIcon,
  FlameIcon,
  PlusIcon,
  PowerIcon,
  SparklesIcon,
  Trash2Icon,
  WorkflowIcon,
  ZapIcon,
} from "lucide-react";

import { useTrpcClient } from "@zentro/api/react";
import { cn } from "@zentro/ui/lib/utils";
import { toastError, toastSuccess } from "@zentro/ui/index";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@zentro/ui/shadcn/dialog";

type AutomationRule = {
  id: string;
  name: string;
  description: string | null;
  enabled: boolean;
  triggerEvent: string;
  triggerConfig: any;
  actionType: string;
  actionConfig: any;
  runCount: number;
  lastRunAt: string | Date | null;
  projectId: string | null;
  projectName: string | null;
  createdAt: string | Date;
};

const TRIGGER_LABELS: Record<string, string> = {
  "task.status_changed": "Status Changed",
  "task.subtasks_all_done": "All Subtasks Completed",
  "task.blockers_resolved": "Blockers Cleared",
  "task.created": "New Task Created",
};

const ACTION_LABELS: Record<string, string> = {
  update_status: "Update Status",
  assign_actor: "Auto-Assign to Actor",
  set_priority: "Set Priority",
};

export const AutomationsManager: FC = () => {
  const trpc = useTrpcClient();
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerEvent, setTriggerEvent] = useState<
    | "task.status_changed"
    | "task.subtasks_all_done"
    | "task.blockers_resolved"
    | "task.created"
  >("task.subtasks_all_done");
  const [toStatus, setToStatus] = useState("in-progress");
  const [actionType, setActionType] = useState<
    "update_status" | "assign_actor" | "set_priority"
  >("update_status");
  const [targetStatus, setTargetStatus] = useState("review");
  const [priority, setPriority] = useState("high");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRules = async () => {
    try {
      const data = await trpc.automation.getAll.query();
      setRules(data as unknown as AutomationRule[]);
    } catch {
      toastError("Error", "Could not load automations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchRules();
  }, []);

  const handleToggle = async (rule: AutomationRule) => {
    const nextState = !rule.enabled;
    setRules((prev) =>
      prev.map((r) => (r.id === rule.id ? { ...r, enabled: nextState } : r)),
    );

    try {
      await trpc.automation.toggle.mutate({
        id: rule.id,
        enabled: nextState,
      });
      toastSuccess(
        nextState ? `Activated ${rule.name}` : `Paused ${rule.name}`,
      );
    } catch {
      setRules((prev) =>
        prev.map((r) => (r.id === rule.id ? { ...r, enabled: !nextState } : r)),
      );
      toastError("Error", "Could not toggle automation");
    }
  };

  const handleDelete = async (id: string, ruleName: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
    try {
      await trpc.automation.delete.mutate({ id });
      toastSuccess(`Deleted rule "${ruleName}"`);
    } catch {
      void fetchRules();
      toastError("Error", "Failed to delete automation");
    }
  };

  const handleSeedPresets = async () => {
    setIsSubmitting(true);
    try {
      const res = await trpc.automation.seedPresets.mutate();
      if (res.count > 0) {
        toastSuccess(`Configured ${res.count} killer automation recipes!`);
      } else {
        toastSuccess("Presets already active.");
      }
      void fetchRules();
    } catch {
      toastError("Error", "Could not seed presets");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const triggerConfig =
        triggerEvent === "task.status_changed" ? { toStatus } : {};
      const actionConfig =
        actionType === "update_status"
          ? { targetStatus }
          : actionType === "set_priority"
            ? { priority }
            : {};

      await trpc.automation.create.mutate({
        name: name.trim(),
        description: description.trim() || null,
        triggerEvent,
        triggerConfig,
        actionType,
        actionConfig,
      });

      toastSuccess(`Created automation "${name.trim()}"`);
      setName("");
      setDescription("");
      setCreateOpen(false);
      void fetchRules();
    } catch {
      toastError("Error", "Failed to create automation rule");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Banner */}
      <div className="tile p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-signal/10 border border-signal/20 text-signal">
            <ZapIcon className="size-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-ink">
              Workflow Automations Engine
            </h2>
            <p className="text-xs text-ink-3 mt-0.5">
              Event-driven reactive rules to auto-transition tasks, rebalance
              subtasks, and eliminate manual busywork.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {rules.length === 0 ? (
            <button
              type="button"
              onClick={handleSeedPresets}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-xl border border-signal bg-signal/10 px-3 py-2 text-xs font-semibold text-signal hover:bg-signal hover:text-white transition-all cursor-pointer"
            >
              <SparklesIcon className="size-3.5" />
              <span>Deploy Recommended Presets</span>
            </button>
          ) : null}

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-3 py-2 text-xs font-semibold text-ink-inverse hover:bg-ink/90 transition-all cursor-pointer"
              >
                <PlusIcon className="size-3.5" />
                <span>New Automation</span>
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-md rounded-2xl border border-hairline bg-surface p-6 shadow-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base font-semibold text-ink">
                  <WorkflowIcon className="size-4 text-signal" />
                  Create Automation Rule
                </DialogTitle>
              </DialogHeader>

              <form
                onSubmit={handleCreateCustom}
                className="flex flex-col gap-4 mt-3"
              >
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-ink">
                    Rule Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Auto-move to Review when done"
                    className="h-9 rounded-lg border border-hairline bg-surface-subtle px-3 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-ink">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Explain what this automation does"
                    className="h-9 rounded-lg border border-hairline bg-surface-subtle px-3 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>

                {/* When Trigger */}
                <div className="rounded-xl border border-hairline/80 bg-surface-subtle/50 p-3 flex flex-col gap-2.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-signal flex items-center gap-1">
                    <ZapIcon className="size-3" /> When (Trigger)
                  </span>
                  <select
                    value={triggerEvent}
                    onChange={(e) => setTriggerEvent(e.target.value as any)}
                    className="h-9 rounded-lg border border-hairline bg-surface px-2.5 text-xs outline-none cursor-pointer"
                  >
                    <option value="task.subtasks_all_done">
                      All Subtasks of a Task are Completed
                    </option>
                    <option value="task.status_changed">
                      Task Status Changes
                    </option>
                    <option value="task.blockers_resolved">
                      All Blocking Dependencies are Cleared
                    </option>
                    <option value="task.created">New Task is Created</option>
                  </select>

                  {triggerEvent === "task.status_changed" ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-ink-3">To status:</span>
                      <select
                        value={toStatus}
                        onChange={(e) => setToStatus(e.target.value)}
                        className="h-8 rounded-lg border border-hairline bg-surface px-2 text-xs outline-none cursor-pointer"
                      >
                        <option value="in-progress">In Progress</option>
                        <option value="review">Review</option>
                        <option value="done">Done</option>
                        <option value="todo">To Do</option>
                      </select>
                    </div>
                  ) : null}
                </div>

                {/* Then Action */}
                <div className="rounded-xl border border-hairline/80 bg-surface-subtle/50 p-3 flex flex-col gap-2.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-500 flex items-center gap-1">
                    <BotIcon className="size-3" /> Then (Action)
                  </span>
                  <select
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value as any)}
                    className="h-9 rounded-lg border border-hairline bg-surface px-2.5 text-xs outline-none cursor-pointer"
                  >
                    <option value="update_status">Update Task Status</option>
                    <option value="assign_actor">
                      Auto-Assign Task to Active Member
                    </option>
                    <option value="set_priority">Set Task Priority</option>
                  </select>

                  {actionType === "update_status" ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-ink-3">Target status:</span>
                      <select
                        value={targetStatus}
                        onChange={(e) => setTargetStatus(e.target.value)}
                        className="h-8 rounded-lg border border-hairline bg-surface px-2 text-xs outline-none cursor-pointer"
                      >
                        <option value="review">Review</option>
                        <option value="in-progress">In Progress</option>
                        <option value="done">Done</option>
                        <option value="todo">To Do</option>
                      </select>
                    </div>
                  ) : null}

                  {actionType === "set_priority" ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-ink-3">Priority:</span>
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                        className="h-8 rounded-lg border border-hairline bg-surface px-2 text-xs outline-none cursor-pointer"
                      >
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                  ) : null}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setCreateOpen(false)}
                    className="h-9 rounded-xl border border-hairline px-3 text-xs text-ink-2 hover:bg-hover cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-9 rounded-xl bg-ink px-4 text-xs font-semibold text-ink-inverse hover:bg-ink/90 cursor-pointer"
                  >
                    Create Rule
                  </button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Rules List */}
      {loading ? (
        <div className="tile p-12 text-center text-ink-3 text-sm">
          Loading automations...
        </div>
      ) : rules.length === 0 ? (
        <div className="tile p-12 text-center text-ink-3 flex flex-col items-center">
          <WorkflowIcon className="size-10 opacity-40 mb-3" />
          <h3 className="text-base font-semibold text-ink">
            No automations configured yet
          </h3>
          <p className="text-xs text-ink-3 max-w-sm mt-1 mb-5">
            Deploy recommended presets to automatically advance parents when
            subtasks complete, auto-assign tasks, and resolve blocker chains.
          </p>
          <button
            type="button"
            onClick={handleSeedPresets}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2.5 text-xs font-semibold text-ink-inverse hover:bg-ink/90 transition-all cursor-pointer"
          >
            <SparklesIcon className="size-4" />
            <span>Deploy Standard Presets Now</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={cn(
                "tile p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all",
                !rule.enabled && "opacity-60 bg-surface-subtle/40",
              )}
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-xl border",
                    rule.enabled
                      ? "bg-signal/10 border-signal/20 text-signal"
                      : "bg-surface-subtle border-hairline text-ink-3",
                  )}
                >
                  <WorkflowIcon className="size-4" />
                </div>

                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-ink truncate">
                      {rule.name}
                    </span>
                    {rule.enabled ? (
                      <span className="rounded-md bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        ACTIVE
                      </span>
                    ) : (
                      <span className="rounded-md bg-sunken px-1.5 py-0.5 font-mono text-[10px] text-ink-3">
                        PAUSED
                      </span>
                    )}
                  </div>

                  {rule.description ? (
                    <p className="text-xs text-ink-3 mt-0.5">
                      {rule.description}
                    </p>
                  ) : null}

                  {/* Trigger -> Action logic badge */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[11px] font-mono text-ink-2">
                    <span className="rounded bg-surface-subtle border border-hairline px-1.5 py-0.5">
                      WHEN:{" "}
                      {TRIGGER_LABELS[rule.triggerEvent] ?? rule.triggerEvent}
                    </span>
                    <span className="text-ink-3">→</span>
                    <span className="rounded bg-surface-subtle border border-hairline px-1.5 py-0.5">
                      THEN: {ACTION_LABELS[rule.actionType] ?? rule.actionType}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats & Controls */}
              <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-hairline/60">
                <div className="flex flex-col sm:items-end text-xs text-ink-3 font-mono">
                  <span>{rule.runCount} executions</span>
                  {rule.lastRunAt ? (
                    <span className="text-[10px] text-ink-3">
                      Last run: {new Date(rule.lastRunAt).toLocaleDateString()}
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggle(rule)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium cursor-pointer transition-colors",
                      rule.enabled
                        ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400"
                        : "border-hairline bg-surface text-ink-3 hover:text-ink",
                    )}
                  >
                    <PowerIcon className="size-3" />
                    <span>{rule.enabled ? "Enabled" : "Paused"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(rule.id, rule.name)}
                    className="p-1.5 rounded-lg text-ink-3 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                    title="Delete rule"
                  >
                    <Trash2Icon className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
