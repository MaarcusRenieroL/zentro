"use client";

import { useState, type FC } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "lucide-react";

import { useTrpcClient } from "@zentro/api/react";
import { toastError } from "@zentro/ui/index";

import { useReachable } from "~/src/components/permissions/permission-provider";
import { paths } from "~/src/lib/paths";

import { createDocSlug } from "../../../lib/docs";

/** Starting points: a title and the headings a doc of that kind needs, in Markdown. */
const templates = [
  {
    id: "spec",
    title: "Spec",
    hint: "Problem, proposal, open questions",
    content: "## Problem\n\n\n\n## Proposal\n\n\n\n## Open questions\n\n- ",
  },
  {
    id: "meeting",
    title: "Meeting notes",
    hint: "Agenda, decisions, follow-up tasks",
    content: "## Agenda\n\n- \n\n## Decisions\n\n\n\n## Follow-up\n\n- [ ] ",
  },
  {
    id: "postmortem",
    title: "Postmortem",
    hint: "Timeline, cause, fixes",
    content: "## Timeline\n\n\n\n## Cause\n\n\n\n## Fixes\n\n- [ ] ",
  },
  {
    id: "weekly",
    title: "Weekly update",
    hint: "Shipped, next, blocked",
    content: "## Shipped\n\n- \n\n## Next\n\n- \n\n## Blocked\n\n",
  },
] as const;

/** Start a doc from a template: it is created, then opened to write in. */
export const TemplateRow: FC = () => {
  const trpc = useTrpcClient();
  const router = useRouter();
  const canCreate = useReachable("docs.create");
  const [busy, setBusy] = useState<string | null>(null);

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

  return (
    <section aria-label="Start from a template" className="flex flex-col gap-3">
      <h2 className="eyebrow">Start from a template</h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {templates.map((template) => (
          <button
            key={template.id}
            type="button"
            disabled={Boolean(busy)}
            onClick={() => void start(template)}
            className="flex min-h-[52px] items-center gap-3 rounded-md border border-dashed border-line-strong px-3.5 py-2 text-left outline-none hover:border-ink-3 hover:bg-hover focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
          >
            <PlusIcon
              className="size-4 shrink-0 text-ink-2"
              aria-hidden="true"
            />
            <span className="flex min-w-0 flex-col">
              <span className="text-sm font-medium">
                {busy === template.id ? "Creating…" : template.title}
              </span>
              <span className="truncate text-xs text-ink-3">
                {template.hint}
              </span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
};
