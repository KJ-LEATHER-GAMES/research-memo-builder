import type { ResearchExitCode } from "./researchExitCode.js";
import type { NormalizedSearchResult } from "./normalizedSearchResult.js";
import type { SearchQueryFailureType } from "./searchExecution.js";

export type FailedSearchQuerySummary = {
  query: string;
  failureType: SearchQueryFailureType;
  httpStatus?: number;
  message: string;
};

export type ResearchRunResult = {
  exitCode: ResearchExitCode;
  queryCount: number;
  executedQueryCount: number;
  succeededQueryCount: number;
  failedQueryCount: number;
  rawResultCount: number;
  normalizedResultCount: number;
  deduplicatedResultCount: number;
  removedDuplicateCount: number;
  removedDuplicateUrls: string[];
  results: NormalizedSearchResult[];
  failures: FailedSearchQuerySummary[];
  warnings: string[];
  generatedFiles: string[];
};
