"use client";

import { FC } from "react";
import {
  BookOpenIcon,
  FileTextIcon,
  FolderGit2Icon,
  SparklesIcon,
} from "lucide-react";
import { CreateDocModal } from "./create-doc-modal";

interface HeaderProps {
  totalDocs?: number;
  projectCount?: number;
  recentCount?: number;
}

export const Header: FC<HeaderProps> = ({
  totalDocs = 0,
  projectCount = 0,
  recentCount = 0,
}) => (
  <div className="flex flex-col gap-4 border-b border-hairline/80 pb-6">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <div className="flex size-7 items-center justify-center rounded-lg bg-tint-docs text-ink">
            <BookOpenIcon className="size-4" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-ink">
            Docs & Living Specs
          </h1>
          <span className="inline-flex items-center gap-1 rounded-full border border-signal/20 bg-signal/5 px-2 py-0.5 text-[11px] font-medium text-signal">
            <SparklesIcon className="size-3" />
            Living Specs
          </span>
        </div>
        <p className="text-sm text-ink-3 max-w-2xl leading-relaxed">
          Product specifications, architectural RFCs, and meeting decisions
          linked directly to your team’s tasks and execution.
        </p>
      </div>

      <div className="flex items-center gap-2.5">
        <CreateDocModal />
      </div>
    </div>

    {/* Quick stats pills */}
    <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-ink-2">
      <div className="inline-flex items-center gap-2 rounded-xl border border-hairline bg-surface px-3.5 py-1.5 font-medium shadow-xs dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]">
        <FileTextIcon className="size-3.5 text-ink-3" />
        <span className="font-mono font-semibold text-ink">{totalDocs}</span>
        <span className="text-ink-3 font-normal">
          {totalDocs === 1 ? "Document" : "Documents"}
        </span>
      </div>

      <div className="inline-flex items-center gap-2 rounded-xl border border-hairline bg-surface px-3.5 py-1.5 font-medium shadow-xs dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]">
        <FolderGit2Icon className="size-3.5 text-ink-3" />
        <span className="font-mono font-semibold text-ink">{projectCount}</span>
        <span className="text-ink-3 font-normal">
          {projectCount === 1 ? "Project" : "Projects"}
        </span>
      </div>

      {recentCount > 0 && (
        <div className="inline-flex items-center gap-2 rounded-xl border border-hairline bg-surface px-3.5 py-1.5 font-medium shadow-xs dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]">
          <span className="size-2 rounded-full bg-status-progress animate-pulse" />
          <span className="font-mono font-semibold text-ink">
            {recentCount}
          </span>
          <span className="text-ink-3 font-normal">Active this week</span>
        </div>
      )}
    </div>
  </div>
);
