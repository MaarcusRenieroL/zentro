export type ViewMode = "month" | "week" | "day";

export const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const addDays = (date: Date, days: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

export const addMonths = (date: Date, months: number) =>
  new Date(date.getFullYear(), date.getMonth() + months, 1);

export const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/** Monday-first start of the week. */
export const startOfWeek = (date: Date) =>
  addDays(startOfDay(date), -((date.getDay() + 6) % 7));

/** The days a view shows, as a flat list. */
export function visibleDays(mode: ViewMode, anchor: Date) {
  if (mode === "day") return [startOfDay(anchor)];

  if (mode === "week") {
    const start = startOfWeek(anchor);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }

  const first = startOfWeek(
    new Date(anchor.getFullYear(), anchor.getMonth(), 1),
  );
  const last = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  const count = Math.ceil(((+startOfWeek(last) - +first) / 864e5 + 7) / 7) * 7;
  return Array.from({ length: count }, (_, i) => addDays(first, i));
}

/** Value for a datetime-local or date input, in local time. */
export function toInput(date: Date, allDay: boolean) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return allDay
    ? day
    : `${day}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromInput(value: string, allDay: boolean) {
  return allDay ? new Date(`${value}T00:00`) : new Date(value);
}
