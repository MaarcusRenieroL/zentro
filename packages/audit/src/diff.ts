import type { AuditChange } from "./types";

export const maxChangeLength = 200;

/** A value as it is stored in a change: text, shortened, or null. */
export function toChangeValue(value: unknown): string | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const text =
    value instanceof Date
      ? value.toISOString()
      : typeof value === "object"
        ? JSON.stringify(value)
        : String(value);

  return text.length > maxChangeLength
    ? `${text.slice(0, maxChangeLength)}…`
    : text;
}

/**
 * The fields that differ between two versions of a resource, as
 * `{field, from, to}`. Only fields present in `after` are compared, so a
 * partial update lists exactly what it touched.
 */
export function buildChanges(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): AuditChange[] {
  const changes: AuditChange[] = [];

  for (const field of Object.keys(after)) {
    if (after[field] === undefined) {
      continue;
    }

    const from = toChangeValue(before[field]);
    const to = toChangeValue(after[field]);

    if (from !== to) {
      changes.push({ field, from, to });
    }
  }

  return changes;
}
