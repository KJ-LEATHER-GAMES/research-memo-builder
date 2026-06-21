import type { BraveSearchResultItem } from "../adapters/braveSearchClient.js";
import type { NormalizedSearchResult } from "../domain/normalizedSearchResult.js";
import type { SearchQuery } from "../domain/searchQuery.js";

export function normalizeSearchResults(params: {
  query: SearchQuery;
  items: BraveSearchResultItem[];
  retrievedAt: string;
}): NormalizedSearchResult[] {
  const results: NormalizedSearchResult[] = [];

  for (const [index, item] of params.items.entries()) {
    const title = normalizeRequiredText(item.title);
    const url = normalizeRequiredText(item.url);

    if (title === undefined || url === undefined) {
      continue;
    }

    results.push({
      keyword: params.query.keyword,
      platform: params.query.platform.name,
      query: params.query.query,
      rank: index + 1,
      title,
      url,
      snippet: normalizeOptionalText(item.description),
      extraSnippets: normalizeExtraSnippets(item.extra_snippets),
      retrievedAt: params.retrievedAt,
    });
  }

  return results;
}

function normalizeRequiredText(value: string | undefined): string | undefined {
  const normalized = value?.trim();

  if (normalized === undefined || normalized.length === 0) {
    return undefined;
  }

  return normalized;
}

function normalizeOptionalText(value: string | undefined): string {
  return value?.trim() ?? "";
}

function normalizeExtraSnippets(
  extraSnippets: BraveSearchResultItem["extra_snippets"],
): string[] {
  if (!Array.isArray(extraSnippets)) {
    return [];
  }

  return extraSnippets
    .map((snippet) => snippet.trim())
    .filter((snippet) => snippet.length > 0);
}
