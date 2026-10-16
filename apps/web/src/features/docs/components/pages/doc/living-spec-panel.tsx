"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  CheckCircle2Icon,
  CircleIcon,
  ClockIcon,
  PlusIcon,
  SparklesIcon,
  ExternalLinkIcon,
  ListTodoIcon,
  CheckSquareIcon,
  LayersIcon,
  RefreshCwIcon,
  MoreVerticalIcon,
  Trash2Icon,
} from "lucide-react";
import { useTrpcClient } from "@zentro/api/react";
import { Button } from "@zentro/ui/shadcn/button";
import { Input } from "@zentro/ui/shadcn/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@zentro/ui/shadcn/dropdown-menu";
import { StatusGlyph, PriorityMeter } from "@zentro/ui/components/status-glyph";
import { toastError, toastSuccess } from "@zentro/ui/index";
import { cn } from "@zentro/ui/lib/utils";
import { ActorAvatar } from "~/src/components/actor-avatar";

export interface LivingSpecTask {
  linkId: string;
  id: string;
  key: string | null;
  title: string;
  status: string | null;
  assignee: string | null;
  priority?: string | null;
  estimatePoints?: number | null;
  href: string;
  relation: string;
}

interface LivingSpecPanelProps {
  docId: string;
  docTitle: string;
  docContent: string;
  projectId?: string | null;
  canEdit: boolean;
  canCreateTask: boolean;
  refreshTrigger?: number;
  onOpenCreateTask: (prefillName?: string) => void;
  onTaskChange?: () => void;
}

const statusOptions = [
  { value: "backlog", label: "Backlog" },
  { value: "todo", label: "To do" },
  { value: "in-progress", label: "In progress" },
  { value: "review", label: "Review" },
  { value: "done", label: "Done" },
] as const;

export function LivingSpecPanel({
  docId,
  docTitle,
  docContent,
  projectId,
  canEdit,
  canCreateTask,
  refreshTrigger = 0,
  onOpenCreateTask,
  onTaskChange,
}: LivingSpecPanelProps) {
  const trpc = useTrpcClient();
  const [tasks, setTasks] = useState<LivingSpecTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "done">("all");
  const [quickTitle, setQuickTitle] = useState("");
  const [isCreatingQuick, setIsCreatingQuick] = useState(false);
  const [updatingTaskKey, setUpdatingTaskKey] = useState<string | null>(null);

  const loadLinkedTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const items = await trpc.link.forDoc.query({ docId });
      const taskItems: LivingSpecTask[] = (items ?? [])
        .filter((item) => item.type === "task")
        .map((item) => ({
          linkId: item.linkId,
          id: item.id,
          key: item.key,
          title: item.title,
          status: item.status,
          assignee: item.assignee,
          priority: item.priority ?? "medium",
          estimatePoints: item.estimatePoints ?? null,
          href: item.href,
          relation: item.relation,
        }));
      setTasks(taskItems);
    } catch (err) {
      // Failed to load
    } finally {
      setIsLoading(false);
    }
  }, [docId, trpc]);

  useEffect(() => {
    void loadLinkedTasks();
  }, [loadLinkedTasks, refreshTrigger]);

  // Extract checklist items and bullet action items from doc content that are not yet tasks
  const extractedActionItems = useMemo(() => {
    if (!docContent) return [];
    const lines = docContent.split("\n");
    const items: string[] = [];

    for (const rawLine of lines) {
      const line = rawLine.trim();
      // Match markdown checklist: - [ ] item or * [ ] item
      const checkboxMatch = line.match(/^[-*]\s+\[\s*\]\s+(.+)$/i);
      if (checkboxMatch && checkboxMatch[1]) {
        const text = checkboxMatch[1].trim();
        if (text.length > 3 && !items.includes(text)) {
          items.push(text);
        }
      }
    }

    // Filter out items that already have a corresponding linked task
    const existingTitles = new Set(
      tasks.map((t) => t.title.trim().toLowerCase()),
    );
    return items.filter((item) => !existingTitles.has(item.toLowerCase()));
  }, [docContent, tasks]);

  // Metrics
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const progressPct =
    totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const totalPoints = tasks.reduce(
    (sum, t) =>
      sum + (typeof t.estimatePoints === "number" ? t.estimatePoints : 0),
    0,
  );
  const donePoints = tasks
    .filter((t) => t.status === "done")
    .reduce(
      (sum, t) =>
        sum + (typeof t.estimatePoints === "number" ? t.estimatePoints : 0),
      0,
    );

  const filteredTasks = tasks.filter((task) => {
    if (filter === "active") return task.status !== "done";
    if (filter === "done") return task.status === "done";
    return true;
  });

  const handleStatusChange = async (taskKey: string, newStatus: string) => {
    if (!taskKey) return;
    try {
      setUpdatingTaskKey(taskKey);
      await trpc.task.updateTaskByKey.mutate({
        key: taskKey,
        status: newStatus as any,
      });
      // Optimistically update
      setTasks((prev) =>
        prev.map((t) => (t.key === taskKey ? { ...t, status: newStatus } : t)),
      );
      toastSuccess(`Task ${taskKey} marked ${newStatus}`);
      onTaskChange?.();
    } catch (err) {
      toastError(err, "Failed to update task status");
      void loadLinkedTasks();
    } finally {
      setUpdatingTaskKey(null);
    }
  };

  const handleQuickCreate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quickTitle.trim() || !projectId) return;

    try {
      setIsCreatingQuick(true);
      await trpc.task.createTask.mutate({
        projectId,
        name: quickTitle.trim(),
        description: `Created from spec "${docTitle}"`,
        status: "todo",
        priority: "medium",
        linkDocId: docId,
      });
      setQuickTitle("");
      toastSuccess("Task compiled to spec");
      await loadLinkedTasks();
      onTaskChange?.();
    } catch (err) {
      toastError(err, "Could not create task");
    } finally {
      setIsCreatingQuick(false);
    }
  };

  const handleUnlink = async (linkId: string, taskKey: string | null) => {
    try {
      await trpc.link.remove.mutate({ linkId });
      toastSuccess(`Unlinked ${taskKey ?? "task"} from spec`);
      setTasks((prev) => prev.filter((t) => t.linkId !== linkId));
      onTaskChange?.();
    } catch (err) {
      toastError(err, "Failed to unlink task");
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface border-l border-hairline overflow-hidden select-none">
      {/* Top Header */}
      <div className="p-4 border-b border-hairline bg-surface/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-signal/10 text-signal">
              <LayersIcon className="size-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-ink leading-tight">
                Living Spec Tasks
              </h3>
              <p className="text-[11px] text-ink-3">
                Live synchronization between Doc & Execution
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => void loadLinkedTasks()}
              title="Refresh tasks"
              className="text-ink-3 hover:text-ink"
            >
              <RefreshCwIcon
                className={cn("size-3.5", isLoading && "animate-spin")}
              />
            </Button>
            {canCreateTask && (
              <Button
                size="xs"
                variant="outline"
                className="gap-1 border-hairline text-xs h-7"
                onClick={() => onOpenCreateTask()}
              >
                <PlusIcon className="size-3" />
                Add
              </Button>
            )}
          </div>
        </div>

        {/* Progress & Spec Completion Gauge */}
        <div className="rounded-lg border border-hairline bg-background/60 p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-ink-2">
              Implementation Progress
            </span>
            <span className="font-mono font-semibold text-signal">
              {progressPct}% ({doneTasks}/{totalTasks})
            </span>
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-signal transition-all duration-500 rounded-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {totalPoints > 0 && (
            <div className="flex items-center justify-between text-[11px] text-ink-3 pt-0.5">
              <span>Story Points Rollup:</span>
              <span className="font-mono font-medium">
                {donePoints} / {totalPoints} pts done
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action Items Compiler Banner (if unlinked checkboxes found in spec) */}
      {extractedActionItems.length > 0 && canCreateTask && (
        <div className="p-3 bg-warning-subtle border-b border-warning/20 text-xs space-y-2">
          <div className="flex items-center justify-between text-warning-text font-medium">
            <div className="flex items-center gap-1.5">
              <SparklesIcon className="size-3.5" />
              <span>
                Spec Action Items Detected ({extractedActionItems.length})
              </span>
            </div>
          </div>
          <p className="text-[11px] text-ink-3 leading-normal">
            Turn markdown checklist items into trackable tickets:
          </p>
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {extractedActionItems.slice(0, 4).map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-2 p-1.5 rounded bg-background/80 border border-hairline"
              >
                <span className="truncate text-ink text-[12px]">{item}</span>
                <Button
                  size="xs"
                  variant="secondary"
                  className="h-6 text-[11px] shrink-0 gap-1 px-2"
                  onClick={() => onOpenCreateTask(item)}
                >
                  <PlusIcon className="size-3" />
                  Compile
                </Button>
              </div>
            ))}
            {extractedActionItems.length > 4 && (
              <p className="text-[10px] text-ink-3 text-center italic">
                + {extractedActionItems.length - 4} more action items in spec
              </p>
            )}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-hairline bg-surface/30 text-xs">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={cn(
              "px-2 py-0.5 rounded text-xs transition-colors",
              filter === "all"
                ? "bg-muted font-medium text-ink"
                : "text-ink-3 hover:text-ink",
            )}
          >
            All ({totalTasks})
          </button>
          <button
            type="button"
            onClick={() => setFilter("active")}
            className={cn(
              "px-2 py-0.5 rounded text-xs transition-colors",
              filter === "active"
                ? "bg-muted font-medium text-ink"
                : "text-ink-3 hover:text-ink",
            )}
          >
            Active ({totalTasks - doneTasks})
          </button>
          <button
            type="button"
            onClick={() => setFilter("done")}
            className={cn(
              "px-2 py-0.5 rounded text-xs transition-colors",
              filter === "done"
                ? "bg-muted font-medium text-ink"
                : "text-ink-3 hover:text-ink",
            )}
          >
            Done ({doneTasks})
          </button>
        </div>
      </div>

      {/* Tasks List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredTasks.length === 0 ? (
          <div className="py-12 text-center text-ink-3 space-y-2">
            <ListTodoIcon className="size-8 mx-auto stroke-1 text-ink-4" />
            <p className="text-xs">
              {totalTasks === 0
                ? "No tasks linked to this spec yet."
                : "No tasks match this filter."}
            </p>
            {canCreateTask && totalTasks === 0 && (
              <Button
                variant="outline"
                size="xs"
                className="text-xs"
                onClick={() => onOpenCreateTask()}
              >
                Create First Task
              </Button>
            )}
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isDone = task.status === "done";
            return (
              <div
                key={task.id}
                className={cn(
                  "group relative p-3 rounded-xl border border-hairline/80 bg-surface/80 hover:bg-surface transition-all hover:border-signal/40 hover:shadow-xs shadow-2xs",
                  isDone && "opacity-70 bg-muted/20",
                )}
              >
                <div className="flex items-start gap-2.5">
                  {/* Status toggle button */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        disabled={!canEdit}
                        className="mt-0.5 shrink-0 rounded hover:scale-110 transition-transform focus:outline-none"
                        title="Change status"
                      >
                        <StatusGlyph status={task.status ?? "todo"} size={14} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-40 text-xs">
                      {statusOptions.map((opt) => (
                        <DropdownMenuItem
                          key={opt.value}
                          className="gap-2 text-xs"
                          onClick={() =>
                            task.key && handleStatusChange(task.key, opt.value)
                          }
                        >
                          <StatusGlyph status={opt.value} size={12} />
                          {opt.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Task details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      {task.key && (
                        <Link
                          href={`/tasks/${task.key}`}
                          className="font-mono text-[11px] font-semibold text-signal hover:underline shrink-0"
                          target="_blank"
                        >
                          {task.key}
                        </Link>
                      )}
                      {task.estimatePoints !== null &&
                        task.estimatePoints !== undefined && (
                          <span className="font-mono text-[10px] px-1 py-0.2 rounded bg-muted/60 text-ink-3">
                            {task.estimatePoints} pts
                          </span>
                        )}
                      <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {task.key && (
                          <Link
                            href={`/tasks/${task.key}`}
                            target="_blank"
                            className="p-1 rounded text-ink-3 hover:text-ink"
                            title="Open task in new tab"
                          >
                            <ExternalLinkIcon className="size-3" />
                          </Link>
                        )}
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => handleUnlink(task.linkId, task.key)}
                            className="p-1 rounded text-ink-3 hover:text-danger-text"
                            title="Unlink from spec"
                          >
                            <Trash2Icon className="size-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p
                      className={cn(
                        "text-xs text-ink font-medium leading-snug line-clamp-2",
                        isDone && "line-through text-ink-3",
                      )}
                    >
                      {task.title}
                    </p>

                    <div className="flex items-center gap-2 mt-2 pt-1 border-t border-hairline/60 text-[11px] text-ink-3">
                      <div className="flex items-center gap-1">
                        <PriorityMeter priority={task.priority ?? "medium"} />
                        <span className="capitalize">
                          {task.priority ?? "medium"}
                        </span>
                      </div>
                      {task.assignee && (
                        <div className="flex items-center gap-1 ml-auto">
                          <ActorAvatar name={task.assignee} size={14} />
                          <span className="truncate max-w-[90px]">
                            {task.assignee}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Add Bar */}
      {canCreateTask && projectId && (
        <form
          onSubmit={handleQuickCreate}
          className="p-3 border-t border-hairline bg-surface/50 flex items-center gap-2"
        >
          <Input
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder="Quick add task to spec..."
            className="h-8 text-xs bg-background"
            disabled={isCreatingQuick}
          />
          <Button
            type="submit"
            size="xs"
            disabled={!quickTitle.trim() || isCreatingQuick}
            loading={isCreatingQuick}
            className="h-8 px-2.5"
          >
            <PlusIcon className="size-3.5" />
          </Button>
        </form>
      )}
    </div>
  );
}
