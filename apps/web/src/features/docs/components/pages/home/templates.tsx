"use client";

import { useState, type FC } from "react";
import { useRouter } from "next/navigation";
import {
  SparklesIcon,
  Code2Icon,
  LayersIcon,
  UsersIcon,
  FlameIcon,
  CheckSquareIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "lucide-react";

import { useTrpcClient } from "@zentro/api/react";
import { toastError } from "@zentro/ui/index";
import { cn } from "@zentro/ui/lib/utils";
import { Button } from "@zentro/ui/shadcn/button";

import { useReachable } from "~/src/components/permissions/permission-provider";
import { paths } from "~/src/lib/paths";
import { createDocSlug } from "../../../lib/docs";

export const templates = [
  {
    id: "spec",
    title: "Product Requirement Spec (PRD)",
    badge: "Product",
    icon: SparklesIcon,
    accent:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    hint: "Problem, user stories, functional scope & task checklist",
    content: `# Product Requirement Document: [Feature Name]

## Problem Statement
What problem does this solve for our users? Why are we prioritizing it now?

## Goals & Non-Goals
- **Goal:** Primary outcome with clear success metrics.
- **Non-Goal:** Scope intentionally deferred to future iterations.

## User Personas & Stories
- As a developer, I want to compile specs directly into tasks.
- As a lead, I want real-time visibility into spec implementation progress.

## Scope & Action Items
- [ ] Define database schema and migrations
- [ ] Implement backend API endpoints and access rules
- [ ] Build split-canvas editor view
- [ ] Add automated unblocking and notifications

## Open Questions & Risks
- [ ] Edge cases under network partition
`,
  },
  {
    id: "rfc",
    title: "Technical RFC & Architecture",
    badge: "Engineering",
    icon: Code2Icon,
    accent: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
    hint: "System design, API contracts, schemas & rollout",
    content: `# Technical RFC: [System / Architecture Title]

## Overview
High-level summary of the proposed architectural change.

## Architecture & Data Flow
\`\`\`
Client -> API Route -> Event Engine -> PostgreSQL
\`\`\`

## Data Models & Schema Migrations
- Schema tables, indexes, and referential constraints
- Migration plan with zero downtime guarantees

## API Contracts & Payloads
- Request and response schemas
- Error codes and validation behaviors

## Security, Scale & Failure Modes
- Permission checks and rate limits
- Rollback plan and disaster recovery
`,
  },
  {
    id: "adr",
    title: "Architecture Decision (ADR)",
    badge: "Architecture",
    icon: LayersIcon,
    accent:
      "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    hint: "Context, decision, tradeoffs & alternatives",
    content: `# Architecture Decision Record: [Decision Title]

## Status
Proposed | Accepted | Deprecated | Superseded

## Context
What forces, requirements, and constraints are driving this decision?

## Decision
What is the architecture choice we are committing to?

## Alternatives Considered
1. **Option A:** Advantages and trade-offs.
2. **Option B:** Advantages and trade-offs.

## Consequences & Tradeoffs
- Positive impacts on developer velocity and maintainability.
- Operational overhead and known limitations.
`,
  },
  {
    id: "meeting",
    title: "Meeting Notes & Action Items",
    badge: "Team",
    icon: UsersIcon,
    accent:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    hint: "Agendas, key decisions, follow-up tickets",
    content: `# Sync & Planning Notes

**Date:** ${new Date().toISOString().slice(0, 10)}  
**Attendees:** Team

## Agenda Topics
- Sprint review and velocity update
- Architectural blockers
- Cross-project dependencies

## Key Decisions
- Agreed on schema migration strategy
- Approved PRD for next milestone

## Action Items
- [ ] Unblock critical path task dependency
- [ ] Review pending pull request
- [ ] Update documentation on knowledge base
`,
  },
  {
    id: "postmortem",
    title: "Incident Postmortem (RCA)",
    badge: "Operations",
    icon: FlameIcon,
    accent:
      "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    hint: "Root cause, timeline, preventive fixes",
    content: `# Incident Postmortem: [Incident Name]

**Date:** ${new Date().toISOString().slice(0, 10)}  
**Severity:** P1 / P2  
**Impact:** Total downtime and affected users

## Executive Summary
Brief summary of the incident and impact.

## Timeline (UTC)
- **10:00** - Alert triggered
- **10:15** - Triage and identification
- **10:45** - Patch deployed
- **11:00** - All systems healthy

## Root Cause Analysis
Detailed 5-Whys analysis on why the incident occurred.

## Preventative Action Items
- [ ] Add automated end-to-end regression test
- [ ] Configure alert threshold in Datadog/Sentry
- [ ] Update disaster recovery runbook
`,
  },
  {
    id: "retrospective",
    title: "Sprint Retrospective",
    badge: "Agile",
    icon: CheckSquareIcon,
    accent:
      "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
    hint: "What went well, what could be improved",
    content: `# Sprint Retrospective

## What Went Well
- Delivered core reactive unblock engine ahead of schedule.
- Zero regression bugs on main branch.

## What Could Be Improved
- Communication on cross-team dependencies.
- Review turnaround time on large PRs.

## Actionable Commitments
- [ ] Set up PR review alerts
- [ ] Document automation rule recipes
`,
  },
] as const;

export const TemplateRow: FC = () => {
  const trpc = useTrpcClient();
  const router = useRouter();
  const canCreate = useReachable("docs.create");
  const [busy, setBusy] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  if (!canCreate) return null;

  const start = async (template: (typeof templates)[number]) => {
    if (busy) return;

    setBusy(template.id);

    try {
      const doc = await trpc.docs.create.mutate({
        title: template.title,
        content: template.content,
        slug: `${createDocSlug(template.title)}-${Date.now().toString(36)}`,
      });

      router.push(paths.doc(doc.slug));
    } catch (error) {
      toastError(
        "Could not create the doc",
        error instanceof Error ? error.message : "Please try again.",
      );
      setBusy(null);
    }
  };

  const displayedTemplates = expanded ? templates : templates.slice(0, 4);

  return (
    <section aria-label="Start from a template" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-3">
            Quick Start Blueprints
          </h2>
          <span className="text-[11px] text-ink-3">
            ({templates.length} templates)
          </span>
        </div>
        <Button
          variant="ghost"
          size="xs"
          onClick={() => setExpanded((prev) => !prev)}
          className="text-xs text-ink-3 hover:text-ink gap-1 h-7"
        >
          {expanded ? (
            <>
              Show less <ChevronUpIcon className="size-3" />
            </>
          ) : (
            <>
              Show all templates <ChevronDownIcon className="size-3" />
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {displayedTemplates.map((template) => {
          const Icon = template.icon;
          return (
            <button
              key={template.id}
              type="button"
              disabled={Boolean(busy)}
              onClick={() => void start(template)}
              className="group relative flex flex-col justify-between rounded-xl border border-hairline bg-surface/40 p-3.5 text-left transition-all hover:border-signal/40 hover:bg-surface hover:shadow-xs focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div
                    className={cn(
                      "flex size-7 items-center justify-center rounded-lg border",
                      template.accent,
                    )}
                  >
                    <Icon className="size-3.5" />
                  </div>
                  <span className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-ink-3">
                    {template.badge}
                  </span>
                </div>
                <h3 className="text-[13px] font-semibold text-ink group-hover:text-signal transition-colors line-clamp-1">
                  {busy === template.id ? "Creating…" : template.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs text-ink-3 leading-relaxed">
                  {template.hint}
                </p>
              </div>

              <div className="mt-3 flex items-center gap-1 text-[11px] font-medium text-ink-3 group-hover:text-signal transition-colors">
                <span>Start blueprint</span>
                <ArrowRightIcon className="size-3 transition-transform group-hover:translate-x-0.5" />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
