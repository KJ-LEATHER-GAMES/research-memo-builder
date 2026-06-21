import type { NormalizedSearchResult } from "./normalizedSearchResult.js";

export type DeduplicationResult = {
  results: NormalizedSearchResult[];
  removedCount: number;
  removedUrls: string[];
};
