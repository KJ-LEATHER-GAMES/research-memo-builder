export type MarkdownInlineValue = string | number | boolean | null | undefined;

const MARKDOWN_SPECIAL_CHAR_PATTERN = /[\\`*_{}\[\]<>()#+\-!|]/g;
const LINE_BREAK_PATTERN = /\r\n|\r|\n/g;
const CONTINUOUS_WHITESPACE_PATTERN = /[ \t]+/g;

export function escapeMarkdownInline(value: MarkdownInlineValue): string {
  return normalizeMarkdownInline(value).replace(
    MARKDOWN_SPECIAL_CHAR_PATTERN,
    "\\$&",
  );
}

export function formatMarkdownInline(
  value: MarkdownInlineValue,
  emptyText = "なし",
): string {
  const escapedValue = escapeMarkdownInline(value);

  return escapedValue.length > 0 ? escapedValue : emptyText;
}

export function formatMarkdownInlineList(
  values: readonly MarkdownInlineValue[],
  separator = " / ",
  emptyText = "なし",
): string {
  const escapedValues = values
    .map((value) => escapeMarkdownInline(value))
    .filter((value) => value.length > 0);

  return escapedValues.length > 0 ? escapedValues.join(separator) : emptyText;
}

function normalizeMarkdownInline(value: MarkdownInlineValue): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(LINE_BREAK_PATTERN, " ")
    .replace(CONTINUOUS_WHITESPACE_PATTERN, " ")
    .trim();
}
