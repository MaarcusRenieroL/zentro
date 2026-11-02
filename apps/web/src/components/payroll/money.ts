/** Formats whole minor units (cents) as money in the given currency. */
export function formatMoney(minor: number, currency = "USD") {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(minor / 100);
  } catch {
    return `${(minor / 100).toFixed(2)} ${currency}`;
  }
}

export function formatPeriod(start: string, end: string) {
  const format = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

  return `${format.format(new Date(`${start}T00:00:00Z`))} – ${format.format(new Date(`${end}T00:00:00Z`))}`;
}

export const runTone: Record<string, string> = {
  draft: "bg-sunken text-ink-2",
  approved: "bg-tint-sun text-ink",
  paid: "bg-tint-teams text-ink",
};
