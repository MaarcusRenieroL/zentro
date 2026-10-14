export type FocusCandidate = {
  key: string;
  status: string;
  priority: string;
  dueAt: Date | string | null;
  createdAt: Date | string;
};

export type FocusReason =
  | { kind: "overdue"; days: number }
  | { kind: "due-today" }
  | { kind: "high-priority" }
  | { kind: "oldest" };

const day = 86_400_000;

function startOfDay(date: Date) {
  const copy = new Date(date);

  copy.setHours(0, 0, 0, 0);

  return copy;
}

const time = (value: Date | string) => new Date(value).getTime();

/** Tasks nobody is waiting on you for: done and in-review work is skipped. */
export function isFocusable(task: Pick<FocusCandidate, "status">) {
  return task.status !== "done" && task.status !== "review";
}

type Ranked<T> = { task: T; tier: number; reason: FocusReason };

function rank<T extends FocusCandidate>(task: T, now: Date): Ranked<T> {
  const today = startOfDay(now).getTime();
  const due = task.dueAt ? time(task.dueAt) : null;

  if (due !== null && due < today) {
    return {
      task,
      tier: 0,
      reason: {
        kind: "overdue",
        days: Math.max(
          1,
          Math.round((today - startOfDay(new Date(due)).getTime()) / day),
        ),
      },
    };
  }

  if (due !== null && due < today + day) {
    return { task, tier: 1, reason: { kind: "due-today" } };
  }

  if (task.priority === "high") {
    return { task, tier: 2, reason: { kind: "high-priority" } };
  }

  return { task, tier: 3, reason: { kind: "oldest" } };
}

/**
 * Puts a person's open tasks in the order they should do them: overdue first
 * (longest overdue first), then due today, then high priority, then whatever
 * has waited longest. Within a tier a task already in progress goes first, so
 * Zentro never steals you away from something you have started.
 */
export function rankTasks<T extends FocusCandidate>(
  tasks: readonly T[],
  now: Date = new Date(),
): Array<{ task: T; reason: FocusReason }> {
  return tasks
    .filter(isFocusable)
    .map((task) => rank(task, now))
    .sort((a, b) => {
      if (a.tier !== b.tier) return a.tier - b.tier;

      const started =
        Number(b.task.status === "in-progress") -
        Number(a.task.status === "in-progress");

      if (started) return started;

      if (a.tier <= 1) {
        const dueDiff = time(a.task.dueAt!) - time(b.task.dueAt!);

        if (dueDiff) return dueDiff;
      }

      return time(a.task.createdAt) - time(b.task.createdAt);
    })
    .map(({ task, reason }) => ({ task, reason }));
}

/** The one task to do next, and the one-line reason for it. */
export function pickFocus<T extends FocusCandidate>(
  tasks: readonly T[],
  now: Date = new Date(),
) {
  return rankTasks(tasks, now)[0] ?? null;
}

export function describeFocusReason(reason: FocusReason) {
  switch (reason.kind) {
    case "overdue":
      return reason.days === 1
        ? "Due yesterday, so it comes first."
        : `${reason.days} days past its due date, so it comes first.`;
    case "due-today":
      return "Due today.";
    case "high-priority":
      return "High priority, and nothing is due sooner.";
    case "oldest":
      return "It has waited the longest.";
  }
}
