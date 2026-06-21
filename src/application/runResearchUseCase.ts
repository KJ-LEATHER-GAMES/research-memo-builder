import { BraveSearchClient } from "../adapters/braveSearchClient.js";
import { loadEnvConfig } from "../config/env.js";
import { ResearchExitCode } from "../domain/researchExitCode.js";
import type { ResolvedResearchInput } from "../domain/researchInput.js";
import type { SearchQueryExecutionResult } from "../domain/searchExecution.js";
import { buildSearchQueries } from "../services/searchQueryBuilder.js";
import type { BraveSearchResultItem } from "../adapters/braveSearchClient.js";

export type RunResearchUseCaseResult = {
  exitCode: ResearchExitCode;
  queryCount: number;
  executedQueryCount: number;
  retrievedItemCount: number;
  firstQuery?: string;
  executionResult?: SearchQueryExecutionResult<BraveSearchResultItem>;
};

export async function runResearchUseCase(
  input: ResolvedResearchInput,
): Promise<RunResearchUseCaseResult> {
  const queries = buildSearchQueries(input);

  const firstQuery = queries[0];

  if (firstQuery === undefined) {
    return {
      exitCode: ResearchExitCode.INPUT_ERROR,
      queryCount: 0,
      executedQueryCount: 0,
      retrievedItemCount: 0,
    };
  }

  const env = loadEnvConfig();

  const client = new BraveSearchClient({
    apiKey: env.braveApiKey,
  });

  const executionResult = await client.search(firstQuery);

  if (executionResult.status === "failure") {
    return {
      exitCode: ResearchExitCode.ALL_API_FAILURE,
      queryCount: queries.length,
      executedQueryCount: 1,
      retrievedItemCount: 0,
      firstQuery: firstQuery.query,
      executionResult,
    };
  }

  return {
    exitCode: ResearchExitCode.SUCCESS,
    queryCount: queries.length,
    executedQueryCount: 1,
    retrievedItemCount: executionResult.items.length,
    firstQuery: firstQuery.query,
    executionResult,
  };
}
