"use client";

import { FC, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  ClockIcon,
  FilterIcon,
  FlameIcon,
  GitCommitIcon,
  LayersIcon,
  NetworkIcon,
  SearchIcon,
  ShieldAlertIcon,
} from "lucide-react";

import { useTrpcClient } from "@zentro/api/react";
import { StatusGlyph, PriorityMeter } from "@zentro/ui/components/status-glyph";
import { cn } from "@zentro/ui/lib/utils";
import { paths } from "~/src/lib/paths";
import { ActorAvatar } from "~/src/components/actor-avatar";

type Props = {
  projectSlug: string;
};

type Node = {
  id: string;
  key: string;
  title: string;
  status: string;
  priority: string;
  estimatePoints: number | null;
  dueAt: string | null;
  assignee: string;
  teamName: string | null;
  stage: number;
  blocksCount: number;
  blockedByCount: number;
  isCritical: boolean;
  isBottleneck: boolean;
};

type Edge = {
  sourceKey: string;
  targetKey: string;
  isBlockerDone: boolean;
  isBlockedDone: boolean;
};

type GraphData = {
  project: { id: string; name: string; slug: string };
  nodes: Node[];
  edges: Edge[];
  criticalPath: string[];
  bottlenecks: string[];
  metrics: {
    totalTasks: number;
    totalDependencies: number;
    criticalPathLength: number;
    blockedTasksCount: number;
    bottlenecksCount: number;
    riskLevel: "low" | "moderate" | "high";
  };
};

export const CriticalPathVisualizer: FC<Props> = ({ projectSlug }) => {
  const trpc = useTrpcClient();
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<
    "all" | "critical" | "bottlenecks"
  >("all");
  const [search, setSearch] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  // Load graph data
  useEffect(() => {
    let active = true;
    trpc.project.getDependencyGraph
      .query({ slug: projectSlug })
      .then((res) => {
        if (active) {
          setData(res as unknown as GraphData);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [projectSlug, trpc]);

  const nodes = data?.nodes ?? [];
  const edges = data?.edges ?? [];
  const metrics = data?.metrics ?? {
    totalTasks: 0,
    totalDependencies: 0,
    criticalPathLength: 0,
    blockedTasksCount: 0,
    bottlenecksCount: 0,
    riskLevel: "low" as const,
  };

  // Filter nodes based on user selection
  const filteredNodes = useMemo(() => {
    let result = nodes;
    if (filterMode === "critical") {
      result = result.filter((n) => n.isCritical);
    } else if (filterMode === "bottlenecks") {
      result = result.filter((n) => n.isBottleneck || n.blockedByCount > 0);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (n) =>
          n.key.toLowerCase().includes(q) || n.title.toLowerCase().includes(q),
      );
    }

    return result;
  }, [nodes, filterMode, search]);

  // Group nodes by topological stage
  const stages = useMemo(() => {
    const map = new Map<number, Node[]>();
    for (const node of filteredNodes) {
      const stageList = map.get(node.stage) ?? [];
      stageList.push(node);
      map.set(node.stage, stageList);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a - b);
  }, [filteredNodes]);

  // Direct dependencies of currently selected task
  const relatedEdges = useMemo(() => {
    if (!selectedKey) return [];
    return edges.filter(
      (e) => e.sourceKey === selectedKey || e.targetKey === selectedKey,
    );
  }, [selectedKey, edges]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-ink-3">
        <NetworkIcon className="size-8 animate-pulse text-signal mb-3" />
        <p className="text-sm">
          Analyzing project dependency DAG & critical path...
        </p>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="tile p-12 text-center text-ink-3">
        <NetworkIcon className="mx-auto size-9 opacity-40 mb-3" />
        <h3 className="text-base font-semibold text-ink">
          No tasks found in project
        </h3>
        <p className="text-sm mt-1">
          Create tasks and link them as blockers to visualize the critical path.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <div className="flex flex-col gap-1 rounded-2xl border border-hairline/80 bg-surface/80 p-4 shadow-2xs transition-all hover:border-hairline hover:shadow-xs">
          <div className="flex items-center justify-between text-xs text-ink-3">
            <span className="font-medium">Critical Path</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-signal/10 text-signal">
              <FlameIcon className="size-3.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold tracking-tight text-ink">
              {metrics.criticalPathLength}
            </span>
            <span className="text-xs text-ink-3">tasks chained</span>
          </div>
          <p className="mt-0.5 text-[11px] text-ink-3">
            Longest bottleneck path determining launch date
          </p>
        </div>

        <div className="flex flex-col gap-1 rounded-2xl border border-hairline/80 bg-surface/80 p-4 shadow-2xs transition-all hover:border-hairline hover:shadow-xs">
          <div className="flex items-center justify-between text-xs text-ink-3">
            <span className="font-medium">Dependencies</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-muted/60 text-ink-3">
              <GitCommitIcon className="size-3.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold tracking-tight text-ink">
              {metrics.totalDependencies}
            </span>
            <span className="text-xs text-ink-3">blocker links</span>
          </div>
          <p className="mt-0.5 text-[11px] text-ink-3">
            {metrics.blockedTasksCount} tasks currently waiting
          </p>
        </div>

        <div className="flex flex-col gap-1 rounded-2xl border border-hairline/80 bg-surface/80 p-4 shadow-2xs transition-all hover:border-hairline hover:shadow-xs">
          <div className="flex items-center justify-between text-xs text-ink-3">
            <span className="font-medium">Bottlenecks</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <AlertTriangleIcon className="size-3.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold tracking-tight text-ink">
              {metrics.bottlenecksCount}
            </span>
            <span className="text-xs text-ink-3">high blast radius</span>
          </div>
          <p className="mt-0.5 text-[11px] text-ink-3">
            Tasks blocking multiple downstream work items
          </p>
        </div>

        <div className="flex flex-col gap-1 rounded-2xl border border-hairline/80 bg-surface/80 p-4 shadow-2xs transition-all hover:border-hairline hover:shadow-xs">
          <div className="flex items-center justify-between text-xs text-ink-3">
            <span className="font-medium">Project Risk</span>
            <div
              className={cn(
                "flex size-7 items-center justify-center rounded-lg",
                metrics.riskLevel === "high"
                  ? "bg-rose-500/10 text-rose-500"
                  : metrics.riskLevel === "moderate"
                    ? "bg-amber-500/10 text-amber-500"
                    : "bg-emerald-500/10 text-emerald-500",
              )}
            >
              <ShieldAlertIcon className="size-3.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span
              className={cn(
                "font-mono text-2xl font-bold tracking-tight uppercase",
                metrics.riskLevel === "high"
                  ? "text-rose-500"
                  : metrics.riskLevel === "moderate"
                    ? "text-amber-500"
                    : "text-emerald-500",
              )}
            >
              {metrics.riskLevel}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-ink-3">
            {metrics.riskLevel === "high"
              ? "Overdue or heavy blocker chain detected"
              : metrics.riskLevel === "moderate"
                ? "Active dependency bottlenecks exist"
                : "Smooth schedule with minimal bottlenecks"}
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-hairline/80 bg-surface/80 p-3 shadow-2xs">
        <div className="flex items-center gap-1.5">
          <FilterIcon className="size-3.5 text-ink-3 ml-1" />
          <button
            type="button"
            onClick={() => setFilterMode("all")}
            className={cn(
              "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
              filterMode === "all"
                ? "bg-ink text-ink-inverse"
                : "text-ink-2 hover:bg-hover hover:text-ink",
            )}
          >
            All Work ({nodes.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("critical")}
            className={cn(
              "inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
              filterMode === "critical"
                ? "bg-signal text-white"
                : "text-ink-2 hover:bg-hover hover:text-ink",
            )}
          >
            <FlameIcon className="size-3" />
            Critical Path ({metrics.criticalPathLength})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("bottlenecks")}
            className={cn(
              "inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
              filterMode === "bottlenecks"
                ? "bg-amber-500 text-white"
                : "text-ink-2 hover:bg-hover hover:text-ink",
            )}
          >
            <AlertTriangleIcon className="size-3" />
            Bottlenecks ({metrics.bottlenecksCount})
          </button>
        </div>

        <div className="relative h-8 w-full sm:w-56">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-ink-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by key or title..."
            className="h-full w-full rounded-lg border border-hairline bg-surface pr-3 pl-8 text-xs outline-none placeholder:text-ink-3 focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      {/* DAG Stage Pipeline Visualizer */}
      <div className="overflow-x-auto pb-4">
        <div className="flex min-w-[700px] gap-5 items-start">
          {stages.map(([stageIdx, stageNodes]) => (
            <div
              key={stageIdx}
              className="flex-1 min-w-[220px] flex flex-col gap-3 rounded-2xl border border-hairline/70 bg-surface-subtle/30 p-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-hairline/60">
                <div className="flex items-center gap-1.5">
                  <LayersIcon className="size-3.5 text-ink-3" />
                  <span className="font-semibold text-xs text-ink">
                    {stageIdx === 0
                      ? "Phase 1: Roots / Unblocked"
                      : `Phase ${stageIdx + 1}: Dependent Work`}
                  </span>
                </div>
                <span className="font-mono text-[11px] text-ink-3">
                  {stageNodes.length} tasks
                </span>
              </div>

              <div className="flex flex-col gap-2.5">
                {stageNodes.map((node) => {
                  const isSelected = selectedKey === node.key;
                  const isDone = node.status === "done";

                  return (
                    <div
                      key={node.id}
                      onClick={() =>
                        setSelectedKey((prev) =>
                          prev === node.key ? null : node.key,
                        )
                      }
                      className={cn(
                        "group relative flex flex-col gap-2 rounded-xl border p-3 cursor-pointer transition-all shadow-xs",
                        isSelected
                          ? "ring-2 ring-signal border-signal bg-signal-subtle/30"
                          : node.isCritical
                            ? "border-signal/40 bg-surface hover:border-signal"
                            : "border-hairline bg-surface hover:border-line-strong",
                        isDone && "opacity-60",
                      )}
                    >
                      {/* Critical path glow banner */}
                      {node.isCritical ? (
                        <div className="flex items-center justify-between text-[10px] font-mono font-semibold text-signal uppercase tracking-wider">
                          <span className="inline-flex items-center gap-1">
                            <FlameIcon className="size-3" /> Critical Path
                          </span>
                          {node.blocksCount > 0 ? (
                            <span>Blocks {node.blocksCount}</span>
                          ) : null}
                        </div>
                      ) : null}

                      {/* Header row: Status glyph + key + priority */}
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <StatusGlyph status={node.status} size={12} />
                          <Link
                            href={paths.task(node.key)}
                            onClick={(e) => e.stopPropagation()}
                            className="font-mono text-xs font-medium text-ink hover:underline truncate"
                          >
                            {node.key}
                          </Link>
                        </div>
                        <PriorityMeter priority={node.priority} />
                      </div>

                      {/* Title */}
                      <p
                        className={cn(
                          "text-xs leading-snug line-clamp-2 text-ink-2",
                          isDone && "line-through text-ink-3",
                        )}
                      >
                        {node.title}
                      </p>

                      {/* Footer tags */}
                      <div className="flex items-center justify-between pt-1 border-t border-hairline/40 text-[11px] text-ink-3">
                        <div className="flex items-center gap-1.5">
                          <ActorAvatar name={node.assignee} size={18} />
                          <span className="truncate max-w-[80px]">
                            {node.assignee.split(" ")[0]}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          {node.estimatePoints ? (
                            <span className="font-mono text-[10px] rounded bg-surface-subtle px-1 py-0.5">
                              {node.estimatePoints}pt
                            </span>
                          ) : null}
                          {node.isBottleneck ? (
                            <span
                              title={`Blocks ${node.blocksCount} tasks`}
                              className="inline-flex items-center gap-0.5 text-[10px] font-mono text-amber-500 font-semibold"
                            >
                              <AlertTriangleIcon className="size-3" />
                              {node.blocksCount}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Task Inspector */}
      {selectedKey ? (
        <div className="tile p-4 flex flex-col gap-3 motion-safe:animate-fade-up">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-3">
              Dependency Inspection:{" "}
              <span className="text-ink font-mono">{selectedKey}</span>
            </h4>
            <button
              type="button"
              onClick={() => setSelectedKey(null)}
              className="text-xs text-ink-3 hover:text-ink cursor-pointer"
            >
              Clear selection
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Direct Blockers */}
            <div className="flex flex-col gap-1.5 rounded-xl border border-hairline bg-surface-subtle/40 p-3">
              <span className="text-[11px] font-medium text-ink-3">
                Blocked by (must finish before {selectedKey}):
              </span>
              {relatedEdges.filter((e) => e.targetKey === selectedKey)
                .length === 0 ? (
                <p className="text-xs text-ink-3 italic">
                  No blockers — ready to proceed.
                </p>
              ) : (
                relatedEdges
                  .filter((e) => e.targetKey === selectedKey)
                  .map((e) => (
                    <div
                      key={e.sourceKey}
                      className="flex items-center justify-between text-xs py-0.5"
                    >
                      <Link
                        href={paths.task(e.sourceKey)}
                        className="font-mono text-signal hover:underline"
                      >
                        {e.sourceKey}
                      </Link>
                      <span className="flex items-center gap-1 text-[11px] text-ink-3">
                        {e.isBlockerDone ? (
                          <span className="inline-flex items-center gap-1 text-emerald-500 font-mono">
                            <CheckCircle2Icon className="size-3" /> Resolved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-500 font-mono">
                            <ClockIcon className="size-3" /> Incomplete
                          </span>
                        )}
                      </span>
                    </div>
                  ))
              )}
            </div>

            {/* Direct Dependents */}
            <div className="flex flex-col gap-1.5 rounded-xl border border-hairline bg-surface-subtle/40 p-3">
              <span className="text-[11px] font-medium text-ink-3">
                Blocks (waiting on {selectedKey}):
              </span>
              {relatedEdges.filter((e) => e.sourceKey === selectedKey)
                .length === 0 ? (
                <p className="text-xs text-ink-3 italic">
                  Does not block any downstream tasks.
                </p>
              ) : (
                relatedEdges
                  .filter((e) => e.sourceKey === selectedKey)
                  .map((e) => (
                    <div
                      key={e.targetKey}
                      className="flex items-center justify-between text-xs py-0.5"
                    >
                      <Link
                        href={paths.task(e.targetKey)}
                        className="font-mono text-signal hover:underline"
                      >
                        {e.targetKey}
                      </Link>
                      <span className="flex items-center gap-1 text-[11px] text-ink-3 font-mono">
                        <ArrowRightIcon className="size-3 text-ink-3" />
                        {e.isBlockedDone ? "Done" : "Waiting"}
                      </span>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
