import { and, eq, inArray, isNull, notInArray } from "@zentro/db/drizzle";
import { tasks, workLinks } from "@zentro/db/schema";

import type { DbHandle } from "./access";

// "ZEN-12", "BIL-4": a project key prefix, a dash and a number.
const taskKeyPattern = /\b[A-Z][A-Z0-9]{1,9}-\d{1,6}\b/g;

/** The distinct task keys named in a piece of text. */
export function taskKeysIn(text: string | null | undefined): string[] {
  if (!text) return [];

  return [...new Set(text.match(taskKeyPattern) ?? [])].slice(0, 100);
}

type Source = { type: "task" | "doc" | "message"; id: string };

/**
 * Keeps "mentions" links in step with the task keys a text names. A doc's
 * content and a task's description replace their own mentions on every
 * save (`replace`), so removing a key removes the link. Comments only ever
 * add (`append`), since one comment cannot speak for the others.
 */
export async function syncMentions(
  tx: DbHandle,
  input: {
    organizationId: string;
    memberId: string | null;
    source: Source;
    text: string | null | undefined;
    via: "content" | "description" | "comment" | "chat";
    mode: "replace" | "append";
  },
) {
  const keys = taskKeysIn(input.text);
  const named = keys.length
    ? await tx
        .select({ id: tasks.id })
        .from(tasks)
        .where(
          and(
            eq(tasks.organizationId, input.organizationId),
            inArray(tasks.key, keys),
            isNull(tasks.deletedAt),
          ),
        )
    : [];
  // A task's own key in its own text is not a link.
  const targetIds = named
    .map((row) => row.id)
    .filter((id) => !(input.source.type === "task" && id === input.source.id));

  if (input.mode === "replace") {
    await tx
      .delete(workLinks)
      .where(
        and(
          eq(workLinks.organizationId, input.organizationId),
          eq(workLinks.sourceType, input.source.type),
          eq(workLinks.sourceId, input.source.id),
          eq(workLinks.kind, "mentions"),
          eq(workLinks.via, input.via),
          targetIds.length
            ? notInArray(workLinks.targetId, targetIds)
            : undefined,
        ),
      );
  }

  if (!targetIds.length) return;

  await tx
    .insert(workLinks)
    .values(
      targetIds.map((targetId) => ({
        organizationId: input.organizationId,
        sourceType: input.source.type,
        sourceId: input.source.id,
        targetType: "task",
        targetId,
        kind: "mentions",
        via: input.via,
        createdByMemberId: input.memberId,
      })),
    )
    .onConflictDoNothing();
}
