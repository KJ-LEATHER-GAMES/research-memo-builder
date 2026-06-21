import type { DeduplicationResult } from "../domain/deduplicationResult.js";
import type { NormalizedSearchResult } from "../domain/normalizedSearchResult.js";

export function deduplicateByExactUrl(
  results: NormalizedSearchResult[],
): DeduplicationResult {
  const seenUrls = new Set<string>();
  const deduplicatedResults: NormalizedSearchResult[] = [];
  const removedUrls: string[] = [];

  for (const result of results) {
    if (seenUrls.has(result.url)) {
      removedUrls.push(result.url);
      continue;
    }

    seenUrls.add(result.url);
    deduplicatedResults.push(result);
  }

  return {
    results: deduplicatedResults,
    removedCount: removedUrls.length,
    removedUrls,
  };
}
