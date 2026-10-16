"use client";

import { FC, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircleIcon,
  ArrowRightLeftIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  ChevronUpIcon,
  GaugeIcon,
  ScaleIcon,
  SparklesIcon,
  UsersIcon,
} from "lucide-react";

import { useTrpcClient } from "@zentro/api/react";
import { StatusGlyph, PriorityMeter } from "@zentro/ui/components/status-glyph";
import { cn } from "@zentro/ui/lib/utils";
import { toastError, toastSuccess } from "@zentro/ui/index";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@zentro/ui/shadcn/dropdown-menu";

import { ActorAvatar } from "~/src/components/actor-avatar";
import { paths } from "~/src/lib/paths";

export type MemberCapacity = {
  memberId: string;
  userId: string;
  name: string;
  openCount: number;
  inProgressCount: number;
  overdueCount: number;
  totalPoints?: number;
  utilizationPercent?: number;
  isOverloaded?: boolean;
  isUnderutilized?: boolean;
};

export type WorkloadTask = {
  id: string;
  key: string;
  name: string;
  status: string;
  priority: string | null;
  estimatePoints?: number | null;
  dueAt: Date | string | null;
  projectId: string;
  projectName: string;
  projectSlug: string;
  assignedToMemberId: string | null;
  assigneeName: string | null;
  createdAt: Date | string;
};

type Props = {
  teamId: string;
  members: MemberCapacity[];
  tasks: WorkloadTask[];
  onTasksUpdated?: () => void;
};

export const TeamWorkloadBalancer: FC<Props> = ({
  members,
  tasks,
  onTasksUpdated,
}) => {
  const trpc = useTrpcClient();
  const [expandedMembers, setExpandedMembers] = useState<
    Record<string, boolean>
  >({});
  const [localTasks, setLocalTasks] = useState<WorkloadTask[]>(tasks);
  const [reassigningKey, setReassigningKey] = useState<string | null>(null);

  // Sync tasks when props change
  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  const toggleExpand = (memberId: string) => {
    setExpandedMembers((prev) => ({
      ...prev,
      [memberId]: !prev[memberId],
    }));
  };

  const handleReassign = async (
    taskKey: string,
    targetMemberId: string,
    targetMemberName: string,
  ) => {
    if (reassigningKey) return;
    setReassigningKey(taskKey);

    // Optimistic local state update
    const prevTasks = [...localTasks];
    setLocalTasks((prev) =>
      prev.map((t) =>
        t.key === taskKey
          ? {
              ...t,
              assignedToMemberId: targetMemberId,
              assigneeName: targetMemberName,
            }
          : t,
      ),
    );

    try {
      await trpc.task.updateTaskByKey.mutate({
        key: taskKey,
        assignedToMemberId: targetMemberId,
      });
      toastSuccess(`Reassigned ${taskKey} to ${targetMemberName}`);
      onTasksUpdated?.();
    } catch {
      setLocalTasks(prevTasks);
      toastError("Error", `Could not reassign task ${taskKey}`);
    } finally {
      setReassigningKey(null);
    }
  };

  // Recompute live member loads based on local tasks
  const openTasks = localTasks.filter((t) => t.status !== "done");
  const liveMemberLoads = members.map((member) => {
    const assigned = openTasks.filter(
      (t) => t.assignedToMemberId === member.memberId,
    );
    const inProgress = assigned.filter(
      (t) => t.status === "in-progress",
    ).length;
    const overdue = assigned.filter(
      (t) => t.dueAt && new Date(t.dueAt).getTime() < Date.now(),
    ).length;
    const points = assigned.reduce(
      (sum, t) => sum + (t.estimatePoints ?? 0),
      0,
    );
    const utilization = Math.min(200, Math.round((assigned.length / 5) * 100));

    return {
      ...member,
      openCount: assigned.length,
      inProgressCount: inProgress,
      overdueCount: overdue,
      totalPoints: points,
      utilizationPercent: utilization,
      isOverloaded: assigned.length > 5 || overdue > 1,
      isUnderutilized: assigned.length <= 1,
      assignedTasks: assigned,
    };
  });

  const overloadedCount = liveMemberLoads.filter((m) => m.isOverloaded).length;
  const underutilizedCount = liveMemberLoads.filter(
    (m) => m.isUnderutilized,
  ).length;
  const totalOpenPoints = openTasks.reduce(
    (sum, t) => sum + (t.estimatePoints ?? 0),
    0,
  );
  const avgUtilization = liveMemberLoads.length
    ? Math.round(
        liveMemberLoads.reduce(
          (sum, m) => sum + (m.utilizationPercent ?? 0),
          0,
        ) / liveMemberLoads.length,
      )
    : 0;

  return (
    <div className="flex flex-col gap-5">
      {/* Overview Analytics Bar */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <div className="flex flex-col gap-1 rounded-2xl border border-hairline/80 bg-surface/80 p-4 shadow-2xs transition-all hover:border-hairline hover:shadow-xs">
          <div className="flex items-center justify-between text-xs text-ink-3">
            <span className="font-medium">Avg Capacity</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-signal/10 text-signal">
              <GaugeIcon className="size-3.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="font-mono text-xl font-bold tracking-tight text-ink">
              {avgUtilization}%
            </span>
            <span className="text-xs text-ink-3">utilized</span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                avgUtilization > 100
                  ? "bg-danger"
                  : avgUtilization > 80
                    ? "bg-warning"
                    : "bg-success",
              )}
              style={{ width: `${Math.min(100, avgUtilization)}%` }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1 rounded-2xl border border-hairline/80 bg-surface/80 p-4 shadow-2xs transition-all hover:border-hairline hover:shadow-xs">
          <div className="flex items-center justify-between text-xs text-ink-3">
            <span className="font-medium">Overallocated</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-danger-subtle text-danger-text">
              <AlertCircleIcon className="size-3.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span
              className={cn(
                "font-mono text-xl font-bold tracking-tight",
                overloadedCount > 0 ? "text-danger-text" : "text-ink",
              )}
            >
              {overloadedCount}
            </span>
            <span className="text-xs text-ink-3">members</span>
          </div>
          <p className="mt-0.5 text-[11px] text-ink-3">
            {overloadedCount > 0
              ? "Rebalance tasks below"
              : "All within safe limits"}
          </p>
        </div>

        <div className="flex flex-col gap-1 rounded-2xl border border-hairline/80 bg-surface/80 p-4 shadow-2xs transition-all hover:border-hairline hover:shadow-xs">
          <div className="flex items-center justify-between text-xs text-ink-3">
            <span className="font-medium">Available</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-success-subtle text-success-text">
              <CheckCircle2Icon className="size-3.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="font-mono text-xl font-bold tracking-tight text-success-text">
              {underutilizedCount}
            </span>
            <span className="text-xs text-ink-3">can take work</span>
          </div>
          <p className="mt-0.5 text-[11px] text-ink-3">
            Teammates with light backlog
          </p>
        </div>

        <div className="flex flex-col gap-1 rounded-2xl border border-hairline/80 bg-surface/80 p-4 shadow-2xs transition-all hover:border-hairline hover:shadow-xs">
          <div className="flex items-center justify-between text-xs text-ink-3">
            <span className="font-medium">In-Flight Work</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-muted/60 text-ink-3">
              <ScaleIcon className="size-3.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="font-mono text-xl font-bold tracking-tight text-ink">
              {openTasks.length}
            </span>
            <span className="text-xs text-ink-3">
              tasks {totalOpenPoints > 0 ? `(${totalOpenPoints}pts)` : ""}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-ink-3">
            Total open tasks across team
          </p>
        </div>
      </div>

      {/* Member Heatmap & Rebalance Cards */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UsersIcon className="size-4 text-ink-3" />
            <h3 className="text-sm font-semibold text-ink">
              Member Capacity Matrix
            </h3>
          </div>
          <span className="text-xs text-ink-3">
            Click any teammate to view or reassign their tasks
          </span>
        </div>

        {liveMemberLoads.map((member) => {
          const isExpanded =
            expandedMembers[member.memberId] ?? member.isOverloaded;
          const assignedTasks = member.assignedTasks;

          return (
            <div
              key={member.memberId}
              className={cn(
                "flex flex-col rounded-2xl border transition-all duration-200 overflow-hidden",
                member.isOverloaded
                  ? "border-danger/30 bg-danger-subtle/30"
                  : "border-hairline bg-surface",
              )}
            >
              {/* Member Row Header */}
              <button
                type="button"
                onClick={() => toggleExpand(member.memberId)}
                className="flex items-center justify-between gap-3 p-3.5 text-left outline-none hover:bg-hover/60 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <ActorAvatar name={member.name} size={34} />
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-ink truncate">
                        {member.name}
                      </span>
                      {member.isOverloaded ? (
                        <span className="rounded-md bg-danger-subtle border border-danger/30 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-danger-text">
                          OVERLOADED
                        </span>
                      ) : member.isUnderutilized ? (
                        <span className="rounded-md bg-success-subtle border border-success/30 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-success-text">
                          AVAILABLE
                        </span>
                      ) : null}
                    </div>
                    <span className="text-xs text-ink-3 font-mono">
                      {member.openCount} tasks · {member.totalPoints ?? 0} story
                      points
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  {/* Gauge Bar */}
                  <div className="hidden sm:flex flex-col items-end gap-1 w-32">
                    <span className="font-mono text-[11px] text-ink-2 font-medium">
                      {member.utilizationPercent}% load
                    </span>
                    <div className="h-1.5 w-full bg-sunken rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-300",
                          member.isOverloaded
                            ? "bg-danger"
                            : member.utilizationPercent > 80
                              ? "bg-warning"
                              : "bg-success",
                        )}
                        style={{
                          width: `${Math.min(100, member.utilizationPercent ?? 0)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Overdue / In Progress pills */}
                  <div className="flex items-center gap-1.5">
                    {member.overdueCount > 0 ? (
                      <span className="rounded bg-danger-subtle px-1.5 py-0.5 font-mono text-[11px] text-danger-text font-medium">
                        {member.overdueCount} overdue
                      </span>
                    ) : null}
                    {member.inProgressCount > 0 ? (
                      <span className="rounded bg-sunken px-1.5 py-0.5 font-mono text-[11px] text-ink-2">
                        {member.inProgressCount} active
                      </span>
                    ) : null}
                  </div>

                  {isExpanded ? (
                    <ChevronUpIcon className="size-4 text-ink-3" />
                  ) : (
                    <ChevronDownIcon className="size-4 text-ink-3" />
                  )}
                </div>
              </button>

              {/* Expanded Task List & Reassign Toolbar */}
              {isExpanded ? (
                <div className="flex flex-col border-t border-hairline/60 bg-surface-subtle/30 px-3.5 py-2.5">
                  <div className="flex items-center justify-between pb-2 text-xs text-ink-3 font-medium">
                    <span>Assigned Tasks ({assignedTasks.length})</span>
                    <span className="italic text-[11px]">
                      Rebalance by reassigning tasks to other teammates
                    </span>
                  </div>

                  {assignedTasks.length === 0 ? (
                    <p className="py-2 text-xs text-ink-3 italic">
                      No open tasks assigned.
                    </p>
                  ) : (
                    <div className="flex flex-col divide-y divide-hairline/40">
                      {assignedTasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center gap-2.5 py-2 text-xs hover:bg-hover/40 px-1 rounded transition-colors"
                        >
                          <StatusGlyph status={task.status as any} size={12} />
                          <Link
                            href={paths.task(task.key)}
                            className="font-mono text-ink font-medium hover:underline shrink-0"
                          >
                            {task.key}
                          </Link>
                          <Link
                            href={paths.task(task.key)}
                            className="truncate text-ink-2 hover:text-ink flex-1"
                          >
                            {task.name}
                          </Link>

                          {task.estimatePoints ? (
                            <span className="font-mono text-[10px] rounded bg-surface px-1.5 py-0.5 border border-hairline shrink-0">
                              {task.estimatePoints}pt
                            </span>
                          ) : null}

                          <span className="hidden md:inline font-mono text-[10px] text-ink-3 shrink-0">
                            {task.projectName}
                          </span>

                          {/* Reassign Dropdown */}
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              disabled={reassigningKey === task.key}
                              className="inline-flex items-center gap-1 rounded-md border border-hairline bg-surface px-2 py-1 text-[11px] font-medium text-ink-2 hover:bg-hover hover:text-ink shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <ArrowRightLeftIcon className="size-3 text-signal" />
                              <span>Reassign</span>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-56 rounded-xl p-1.5"
                            >
                              <DropdownMenuLabel className="text-[11px] text-ink-3">
                                Transfer {task.key} to:
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {liveMemberLoads
                                .filter((m) => m.memberId !== member.memberId)
                                .map((target) => (
                                  <DropdownMenuItem
                                    key={target.memberId}
                                    onSelect={() =>
                                      handleReassign(
                                        task.key,
                                        target.memberId,
                                        target.name,
                                      )
                                    }
                                    className="flex items-center justify-between text-xs py-1.5 cursor-pointer"
                                  >
                                    <div className="flex items-center gap-2 truncate">
                                      <ActorAvatar
                                        name={target.name}
                                        size={18}
                                      />
                                      <span className="truncate">
                                        {target.name}
                                      </span>
                                    </div>
                                    <span
                                      className={cn(
                                        "font-mono text-[10px] px-1.5 py-0.5 rounded shrink-0 font-medium",
                                        target.isUnderutilized
                                          ? "text-success-text bg-success-subtle"
                                          : target.isOverloaded
                                            ? "text-danger-text bg-danger-subtle"
                                            : "text-ink-3 bg-sunken",
                                      )}
                                    >
                                      {target.openCount} open
                                    </span>
                                  </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};
