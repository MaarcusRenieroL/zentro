export function formatRelativeDate(date: Date | null) {
  if (!date) return "No expiry date";

  const now = Date.now();
  const target = date.getTime();
  const diffInSeconds = Math.round((target - now) / 1000);

  const rtf = new Intl.RelativeTimeFormat("en", {
    numeric: "auto",
  });

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["week", 60 * 60 * 24 * 7],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
    ["second", 1],
  ];

  for (const [unit, secondsInUnit] of units) {
    if (Math.abs(diffInSeconds) >= secondsInUnit || unit === "second") {
      const value = Math.round(diffInSeconds / secondsInUnit);
      return rtf.format(value, unit);
    }
  }

  return rtf.format(0, "second");
}
