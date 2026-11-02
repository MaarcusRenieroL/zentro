export const statusLabels: Record<string, string> = {
  open: "Open",
  pending: "Pending",
  resolved: "Resolved",
  spam: "Spam",
};

export const priorityLabels: Record<string, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
};

export const priorityTone: Record<string, string> = {
  low: "bg-sunken text-ink-2",
  normal: "bg-sunken text-ink-2",
  high: "bg-tint-sun text-ink",
  urgent: "bg-danger-subtle text-danger-text",
};

export const statusTone: Record<string, string> = {
  open: "bg-tint-projects text-ink",
  pending: "bg-tint-sun text-ink",
  resolved: "bg-tint-teams text-ink",
  spam: "bg-sunken text-ink-2",
};

export const selectClass =
  "h-9 rounded-lg border border-line bg-surface px-2.5 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60";

export const messageOf = (error: unknown) =>
  error instanceof Error ? error.message : undefined;
