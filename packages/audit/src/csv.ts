/**
 * One CSV cell. Quotes values that need it, and defuses spreadsheet formulas
 * (cells that start with `=`, `+`, `-` or `@`) with a leading apostrophe.
 */
export function csvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  let text =
    value instanceof Date
      ? value.toISOString()
      : typeof value === "object"
        ? JSON.stringify(value)
        : String(value);

  if (/^[=+\-@\t\r]/.test(text)) {
    text = `'${text}`;
  }

  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function buildCsv(header: string[], rows: unknown[][]): string {
  return [header, ...rows]
    .map((row) => row.map((cell) => csvCell(cell)).join(","))
    .join("\r\n");
}
