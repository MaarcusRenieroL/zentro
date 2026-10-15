export type NotificationKind =
  | "mention"
  | "assignment"
  | "comment"
  | "approval";

export type NotificationItem = {
  id: string;
  kind: NotificationKind;
  /** Chip text when it differs from the kind, such as "Review". */
  chip?: string;
  actor: string;
  /** The verb phrase: "mentioned you in", "assigned you". */
  verb: string;
  /** A task key, project or doc name. */
  object: string;
  /** Task keys read in mono. */
  objectIsKey?: boolean;
  title?: string;
  quote?: string;
  unread: boolean;
  createdAt: string;
  href?: string;
};

export const kindLabels: Record<NotificationKind, string> = {
  mention: "Mention",
  assignment: "Assignment",
  comment: "Comment",
  approval: "Approval",
};

export const kindGroups: Array<{ kind: NotificationKind; label: string }> = [
  { kind: "mention", label: "Mentions" },
  { kind: "assignment", label: "Assignments" },
  { kind: "comment", label: "Comments" },
  { kind: "approval", label: "Approvals" },
];

export function countByKind(items: NotificationItem[]) {
  const counts: Record<NotificationKind, number> = {
    mention: 0,
    assignment: 0,
    comment: 0,
    approval: 0,
  };

  for (const item of items) counts[item.kind] += 1;

  return counts;
}

const dayMs = 24 * 60 * 60 * 1000;

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** "TODAY", "YESTERDAY", then "OCT 12". */
export function dayLabel(iso: string, now: Date = new Date()) {
  const date = new Date(iso);
  const diff = Math.round(
    (startOfDay(now).getTime() - startOfDay(date).getTime()) / dayMs,
  );

  if (diff <= 0) return "TODAY";
  if (diff === 1) return "YESTERDAY";

  return date
    .toLocaleDateString("en-US", { month: "short", day: "numeric" })
    .toUpperCase();
}

/** 24-hour clock time for inbox rows, "09:52". */
export function clockTime(iso: string) {
  const date = new Date(iso);

  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
}

/** Short relative time for the bell: "2m", "3h", then the clock for older. */
export function relativeTime(iso: string, now: Date = new Date()) {
  const minutes = Math.max(
    0,
    Math.round((now.getTime() - new Date(iso).getTime()) / 60000),
  );

  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 60 * 24) return `${Math.floor(minutes / 60)}h`;

  return `${Math.floor(minutes / (60 * 24))}d`;
}

export type InboxDay = { label: string; items: NotificationItem[] };

/** Newest first, grouped by calendar day. */
export function groupByDay(
  items: NotificationItem[],
  now: Date = new Date(),
): InboxDay[] {
  const sorted = [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const days: InboxDay[] = [];

  for (const item of sorted) {
    const label = dayLabel(item.createdAt, now);
    const last = days[days.length - 1];

    if (last && last.label === label) last.items.push(item);
    else days.push({ label, items: [item] });
  }

  return days;
}
