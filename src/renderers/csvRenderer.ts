import type { NormalizedSearchResult } from "../domain/normalizedSearchResult.js";
import { escapeCsvValue } from "../utils/csvEscape.js";

export const CSV_SEARCH_RESULT_HEADERS = [
  "Keyword",
  "Platform",
  "Title",
  "Url",
  "Snippet",
  "ExtraSnippets",
  "Rank",
  "Query",
  "RetrievedAt",
] as const;

export type CsvSearchResultHeader = (typeof CSV_SEARCH_RESULT_HEADERS)[number];

export type CsvSearchResultRow = {
  Keyword: string;
  Platform: string;
  Title: string;
  Url: string;
  Snippet: string;
  ExtraSnippets: string;
  Rank: number;
  Query: string;
  RetrievedAt: string;
};

export function renderSearchResultsCsv(
  results: NormalizedSearchResult[],
): string {
  const lines = [CSV_SEARCH_RESULT_HEADERS.join(",")];

  for (const result of results) {
    const row = toCsvSearchResultRow(result);

    lines.push(
      CSV_SEARCH_RESULT_HEADERS.map((header) =>
        escapeCsvValue(row[header]),
      ).join(","),
    );
  }

  return `${lines.join("\n")}\n`;
}

export function toCsvSearchResultRow(
  result: NormalizedSearchResult,
): CsvSearchResultRow {
  return {
    Keyword: result.keyword,
    Platform: result.platform,
    Title: result.title,
    Url: result.url,
    Snippet: result.snippet,
    ExtraSnippets: result.extraSnippets
      .map((snippet) => normalizeExtraSnippet(snippet))
      .join("/"),
    Rank: result.rank,
    Query: result.query,
    RetrievedAt: result.retrievedAt,
  };
}

function normalizeExtraSnippet(snippet: string): string {
  return snippet.replace(/\r\n|\r|\n/g, " ").trim();
}
