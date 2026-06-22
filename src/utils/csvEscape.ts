export type CsvValue = string | number | boolean | null | undefined;

export function escapeCsvValue(value: CsvValue): string {
  const stringValue =
    value === null || value === undefined ? "" : String(value);

  if (!needsCsvEscape(stringValue)) {
    return stringValue;
  }

  return `"${stringValue.replace(/"/g, '""')}"`;
}

function needsCsvEscape(value: string): boolean {
  return (
    value.includes(",") ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r")
  );
}
