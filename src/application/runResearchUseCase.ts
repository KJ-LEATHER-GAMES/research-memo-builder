import {
  BraveSearchClient,
  type BraveSearchResultItem,
} from "../adapters/braveSearchClient.js";
import { loadEnvConfig } from "../config/env.js";
import { ResearchExitCode } from "../domain/researchExitCode.js";
import type { ResolvedResearchInput } from "../domain/researchInput.js";
import type {
  SearchQueryExecutionResult,
  SearchQueryFailureType,
} from "../domain/searchExecution.js";
import type { NormalizedSearchResult } from "../domain/normalizedSearchResult.js";
import { deduplicateByExactUrl } from "../services/deduplicationService.js";
import { buildSearchQueries } from "../services/searchQueryBuilder.js";
import { normalizeSearchResults } from "../services/searchResultNormalizer.js";
import { writeCsvResearchResults } from "../output/csvResearchResultWriter.js";
import { writeMarkdownResearchMemo } from "../output/markdownResearchMemoWriter.js";

export type FailedSearchQuerySummary = {
  query: string;
  keyword: string;
  platform: string;
  failureType: SearchQueryFailureType;
  httpStatus?: number;
  message: string;
  retrievedAt: string;
};

export type RunResearchUseCaseResult = {
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

  /**
   * Compatibility fields for the current M2-B CLI.
   * These can be removed after src/cli/research.ts is updated for M3.
   */
  firstQuery?: string;
  retrievedItemCount: number;
  executionResult?: SearchQueryExecutionResult<BraveSearchResultItem>;
};

export async function runResearchUseCase(
  input: ResolvedResearchInput,
): Promise<RunResearchUseCaseResult> {
  const queries = buildSearchQueries(input);
  const firstQuery = queries[0];

  if (firstQuery === undefined) {
    return buildEmptyResult({
      exitCode: ResearchExitCode.INPUT_ERROR,
      warnings: ["No search queries were generated."],
    });
  }

  const env = loadEnvConfig();

  const client = new BraveSearchClient({
    apiKey: env.braveApiKey,
  });

  const normalizedResults: NormalizedSearchResult[] = [];
  const failures: FailedSearchQuerySummary[] = [];

  let rawResultCount = 0;
  let succeededQueryCount = 0;
  let failedQueryCount = 0;
  let firstExecutionResult:
    | SearchQueryExecutionResult<BraveSearchResultItem>
    | undefined;

  for (const query of queries) {
    const executionResult = await client.search(query);

    firstExecutionResult ??= executionResult;

    if (executionResult.status === "failure") {
      failedQueryCount += 1;

      failures.push({
        query: executionResult.query.query,
        keyword: executionResult.query.keyword,
        platform: executionResult.query.platform.name,
        failureType: executionResult.failure.type,
        httpStatus: executionResult.failure.httpStatus,
        message: executionResult.failure.message,
        retrievedAt: executionResult.retrievedAt,
      });

      continue;
    }

    succeededQueryCount += 1;
    rawResultCount += executionResult.items.length;

    normalizedResults.push(
      ...normalizeSearchResults({
        query: executionResult.query,
        items: executionResult.items,
        retrievedAt: executionResult.retrievedAt,
      }),
    );
  }

  const deduplicationResult = deduplicateByExactUrl(normalizedResults);
  const droppedResultCount = rawResultCount - normalizedResults.length;
  const warnings = buildWarnings({ droppedResultCount });
  const generatedAt = new Date().toISOString();
  const generatedFiles: string[] = [];

  let exitCode = resolveExitCode({
    succeededQueryCount,
    failedQueryCount,
  });

  if (input.output.csv) {
    try {
      const csvFilePath = await writeCsvResearchResults({
        outputDir: input.output.dir,
        results: deduplicationResult.results,
      });

      generatedFiles.push(csvFilePath);
    } catch (error) {
      warnings.push(buildOutputErrorWarning("CSV", error));
      exitCode = ResearchExitCode.OUTPUT_ERROR;
    }
  }

  if (input.output.markdownMemo) {
    try {
      const markdownFilePath = await writeMarkdownResearchMemo({
        input,
        results: deduplicationResult.results,
        generatedAt,
        outputDir: input.output.dir,
        queryCount: queries.length,
        succeededQueryCount,
        failedQueryCount,
        totalResultCountBeforeDeduplication: rawResultCount,
        totalResultCountAfterDeduplication: deduplicationResult.results.length,
        removedDuplicateCount: deduplicationResult.removedCount,
        warnings,
        exitCode,
      });

      generatedFiles.push(markdownFilePath);
    } catch (error) {
      warnings.push(buildOutputErrorWarning("Markdown", error));
      exitCode = ResearchExitCode.OUTPUT_ERROR;
    }
  }

  return {
    exitCode,

    queryCount: queries.length,
    executedQueryCount: succeededQueryCount + failedQueryCount,
    succeededQueryCount,
    failedQueryCount,

    rawResultCount,
    normalizedResultCount: normalizedResults.length,
    deduplicatedResultCount: deduplicationResult.results.length,

    removedDuplicateCount: deduplicationResult.removedCount,
    removedDuplicateUrls: deduplicationResult.removedUrls,

    results: deduplicationResult.results,
    failures,
    warnings,
    generatedFiles,

    firstQuery: firstQuery.query,
    retrievedItemCount: rawResultCount,
    executionResult: firstExecutionResult,
  };
}

function resolveExitCode(params: {
  succeededQueryCount: number;
  failedQueryCount: number;
}): ResearchExitCode {
  if (params.succeededQueryCount === 0 && params.failedQueryCount > 0) {
    return ResearchExitCode.ALL_API_FAILURE;
  }

  if (params.failedQueryCount > 0) {
    return ResearchExitCode.PARTIAL_API_FAILURE;
  }

  return ResearchExitCode.SUCCESS;
}

function buildWarnings(params: { droppedResultCount: number }): string[] {
  const warnings: string[] = [];

  if (params.droppedResultCount > 0) {
    warnings.push(
      `${params.droppedResultCount} search result(s) were dropped during normalization because title or URL was missing.`,
    );
  }

  return warnings;
}

function buildOutputErrorWarning(outputType: string, error: unknown): string {
  if (error instanceof Error) {
    return `${outputType} output failed: ${error.message}`;
  }

  return `${outputType} output failed: ${String(error)}`;
}

function buildEmptyResult(params: {
  exitCode: ResearchExitCode;
  warnings?: string[];
}): RunResearchUseCaseResult {
  return {
    exitCode: params.exitCode,

    queryCount: 0,
    executedQueryCount: 0,
    succeededQueryCount: 0,
    failedQueryCount: 0,

    rawResultCount: 0,
    normalizedResultCount: 0,
    deduplicatedResultCount: 0,

    removedDuplicateCount: 0,
    removedDuplicateUrls: [],

    results: [],
    failures: [],
    warnings: params.warnings ?? [],
    generatedFiles: [],

    retrievedItemCount: 0,
  };
}
