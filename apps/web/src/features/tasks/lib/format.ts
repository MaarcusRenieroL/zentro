export function formatRelativeTime(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  const minutes = Math.floor((Date.now() - date.getTime()) / 60_000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);

  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatShortDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
