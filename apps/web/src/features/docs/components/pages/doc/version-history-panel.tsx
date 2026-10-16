"use client";

import { FC, useEffect, useState } from "react";
import {
  CheckIcon,
  ClockIcon,
  EyeIcon,
  HistoryIcon,
  RotateCcwIcon,
  XIcon,
} from "lucide-react";

import { useTrpcClient } from "@zentro/api/react";
import { cn } from "@zentro/ui/lib/utils";
import { toastError, toastSuccess } from "@zentro/ui/index";
import { ActorAvatar } from "~/src/components/actor-avatar";

type VersionEntry = {
  id: string;
  action: string;
  createdAt: string | Date;
  actorName: string;
  snippet: string;
  snapshot: string | null;
  length: number;
};

type Props = {
  docId: string;
  isOpen: boolean;
  onClose: () => void;
  onRestore: (content: string) => void;
};

export const VersionHistoryPanel: FC<Props> = ({
  docId,
  isOpen,
  onClose,
  onRestore,
}) => {
  const trpc = useTrpcClient();
  const [history, setHistory] = useState<VersionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let active = true;
    setLoading(true);

    trpc.docs.getVersionHistory
      .query({ id: docId })
      .then((data) => {
        if (active) {
          setHistory(data as unknown as VersionEntry[]);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          toastError("Error", "Could not fetch document version history");
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [docId, isOpen, trpc]);

  if (!isOpen) return null;

  const handleRestore = async (entry: VersionEntry) => {
    if (!entry.snapshot) return;

    setRestoringId(entry.id);
    try {
      await trpc.docs.restoreVersion.mutate({
        id: docId,
        content: entry.snapshot,
      });

      onRestore(entry.snapshot);
      toastSuccess(
        `Restored document to snapshot from ${new Date(
          entry.createdAt,
        ).toLocaleDateString()}`,
      );
      onClose();
    } catch {
      toastError("Error", "Failed to restore version snapshot");
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <aside
      aria-label="Document version history"
      className="fixed inset-y-0 right-0 z-40 flex w-full max-w-sm flex-col border-l border-hairline bg-surface/95 p-5 backdrop-blur-md shadow-2xl transition-all sm:w-96 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-hairline/80 pb-3">
        <div className="flex items-center gap-2">
          <HistoryIcon className="size-4 text-signal" />
          <h2 className="text-sm font-semibold text-ink">Version History</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-ink-3 transition-colors hover:bg-hover hover:text-ink cursor-pointer"
          aria-label="Close version history"
        >
          <XIcon className="size-4" />
        </button>
      </div>

      {/* Snapshots List */}
      <div className="flex-1 overflow-y-auto divide-y divide-hairline/50 py-3">
        {loading ? (
          <div className="flex flex-col gap-3 py-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-xl bg-muted/40"
              />
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="py-12 text-center text-xs text-ink-3">
            No past versions recorded for this document yet.
          </div>
        ) : (
          history.map((entry, index) => {
            const isPreviewing = previewId === entry.id;
            const isLatest = index === 0;

            return (
              <div
                key={entry.id}
                className={cn(
                  "flex flex-col gap-2 rounded-xl p-3 transition-colors",
                  isPreviewing ? "bg-hover/80" : "hover:bg-hover/40",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <ActorAvatar name={entry.actorName} size={18} />
                    <span className="truncate text-xs font-medium text-ink">
                      {entry.actorName}
                    </span>
                    {isLatest && (
                      <span className="rounded-full bg-signal/15 px-1.5 py-0.2 font-mono text-[10px] font-semibold text-signal">
                        Current
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-[11px] text-ink-3 shrink-0">
                    {new Date(entry.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {entry.snippet ? (
                  <p className="line-clamp-2 text-xs text-ink-3 font-mono bg-canvas/40 rounded-lg p-1.5 border border-hairline/40">
                    {entry.snippet}
                  </p>
                ) : null}

                {/* Expanded Snapshot Preview Box */}
                {isPreviewing && entry.snapshot && (
                  <div className="mt-1 flex flex-col gap-2 rounded-lg border border-hairline bg-canvas p-2.5 text-xs text-ink">
                    <div className="flex items-center justify-between text-[11px] text-ink-3 border-b border-hairline/60 pb-1">
                      <span>Snapshot Preview</span>
                      <span>{entry.snapshot.length} chars</span>
                    </div>
                    <pre className="max-h-36 overflow-y-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-ink-2">
                      {entry.snapshot}
                    </pre>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-1 flex items-center justify-end gap-2">
                  {entry.snapshot && (
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewId(isPreviewing ? null : entry.id)
                      }
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-ink-2 hover:bg-surface hover:text-ink transition-colors cursor-pointer"
                    >
                      <EyeIcon className="size-3" />
                      <span>{isPreviewing ? "Hide" : "Preview"}</span>
                    </button>
                  )}

                  {!isLatest && entry.snapshot && (
                    <button
                      type="button"
                      onClick={() => handleRestore(entry)}
                      disabled={restoringId === entry.id}
                      className="inline-flex items-center gap-1 rounded-lg bg-ink px-2.5 py-1 text-[11px] font-semibold text-ink-inverse hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      <RotateCcwIcon className="size-3" />
                      <span>
                        {restoringId === entry.id ? "Restoring..." : "Restore"}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
