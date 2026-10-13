import { getAuditEvent } from "./catalog";
import type { AuditChange, AuditEventLike } from "./types";

const statusLabels: Record<string, string> = {
  backlog: "Backlog",
  todo: "To do",
  "in-progress": "In progress",
  review: "Review",
  done: "Done",
};

export function actorName(
  actor: { name: string | null; email?: string | null } | null,
  actorUserId: string | null,
) {
  if (actor) {
    return actor.name || actor.email || "Someone";
  }

  // The user row is gone, or the system acted.
  return actorUserId ? "Deleted user" : "System";
}

function readable(field: string, value: string | null) {
  if (value === null) {
    return "none";
  }

  return field === "status" ? (statusLabels[value] ?? value) : value;
}

export function getChanges(event: AuditEventLike): AuditChange[] {
  const changes = event.metadata?.changes;

  return Array.isArray(changes) ? (changes as AuditChange[]) : [];
}

/** "title from A to B, priority from low to high" */
export function describeChanges(changes: AuditChange[]) {
  return changes
    .map(
      (change) =>
        `${change.field} from ${readable(change.field, change.from)} to ${readable(change.field, change.to)}`,
    )
    .join(", ");
}

/**
 * A readable sentence, for example "Priya moved ZEN-12 from To do to In
 * progress". Unknown actions fall back to the raw action key.
 */
export function describeEvent(event: AuditEventLike, actor: string): string {
  const definition = getAuditEvent(event.action);
  const target = event.targetLabel ?? `a ${event.targetType}`;
  const changes = getChanges(event);

  if (!definition) {
    return `${actor} ${event.action}${event.targetLabel ? ` (${event.targetLabel})` : ""}`;
  }

  if (event.action === "task.status_changed" && changes[0]) {
    return `${actor} moved ${target} from ${readable("status", changes[0].from)} to ${readable("status", changes[0].to)}`;
  }

  if (event.action === "task.assigned" && changes[0]) {
    const { from, to } = changes[0];

    return to
      ? `${actor} assigned ${target} to ${to}${from ? ` (was ${from})` : ""}`
      : `${actor} unassigned ${target}${from ? ` from ${from}` : ""}`;
  }

  if (
    (event.action === "task.updated" ||
      event.action === "project.updated" ||
      event.action === "team.updated" ||
      event.action === "org.updated") &&
    changes.length
  ) {
    return `${actor} updated ${target}: ${describeChanges(changes)}`;
  }

  return `${actor} ${definition.phrase.replace("{target}", target)}`;
}
