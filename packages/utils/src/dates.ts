export type DueTone = "overdue" | "soon" | "later" | "none";

export type FormattedDue = {
  /** Short text for a list cell: "Oct 18", "Today", "No date". */
  text: string;
  tone: DueTone;
  /** The full date, for a tooltip, title and aria-label. */
  full: string;
};

const day = 86_400_000;

function startOfDay(date: Date) {
  const copy = new Date(date);

  copy.setHours(0, 0, 0, 0);

  return copy;
}

const month = (date: Date) =>
  date.toLocaleDateString("en-US", { month: "short" });

/**
 * How a due date reads in a list: relative for the days around today, short
 * after that. Overdue and within three days are called out through `tone`.
 */
export function formatDueDate(
  value: Date | string | null | undefined,
  now: Date = new Date(),
): FormattedDue {
  if (!value) return { text: "No date", tone: "none", full: "No due date" };

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return { text: "No date", tone: "none", full: "No due date" };
  }

  const full = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const diff = Math.round(
    (startOfDay(date).getTime() - startOfDay(now).getTime()) / day,
  );

  if (diff === 0) return { text: "Today", tone: "soon", full };
  if (diff === 1) return { text: "Tomorrow", tone: "soon", full };
  if (diff === -1) return { text: "Yesterday", tone: "overdue", full };

  const text =
    date.getFullYear() === now.getFullYear()
      ? `${month(date)} ${date.getDate()}`
      : `${month(date)} ${date.getDate()}, ${date.getFullYear()}`;

  if (diff < 0) return { text, tone: "overdue", full };
  if (diff <= 3) return { text, tone: "soon", full };

  return { text, tone: "later", full };
}

/** A timestamp for an event list: "Oct 14, 11:40 AM". */
export function formatEventTime(value: Date | string, now: Date = new Date()) {
  const date = new Date(value);
  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  const diff = Math.round(
    (startOfDay(now).getTime() - startOfDay(date).getTime()) / day,
  );

  if (diff === 0) return `Today, ${time}`;
  if (diff === 1) return `Yesterday, ${time}`;

  const sameYear = date.getFullYear() === now.getFullYear();

  return `${month(date)} ${date.getDate()}${sameYear ? "" : `, ${date.getFullYear()}`}, ${time}`;
}
