import {
  runResearchUseCase,
  type RunResearchUseCaseResult,
} from "../application/runResearchUseCase.js";
import { EnvConfigError } from "../config/env.js";
import { ResearchExitCode } from "../domain/researchExitCode.js";
import type { ResolvedResearchInput } from "../domain/researchInput.js";
import type { SearchQuery } from "../domain/searchQuery.js";
import {
  ResearchInputValidationError,
  validateAndResolveResearchInput,
} from "../input/researchInputSchema.js";
import {
  loadResearchInputFile,
  ResearchInputLoadError,
} from "../input/researchInputLoader.js";
import { buildSearchQueries } from "../services/searchQueryBuilder.js";
import { assertSafeRelativePath, UnsafePathError } from "../utils/safePath.js";

type ResearchCliArgs = {
  input?: string;
  out?: string;
  dryRun: boolean;
  help: boolean;
};

class CliArgumentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CliArgumentError";
  }
}

function printHelp(): void {
  console.log(`
Research Memo Builder

Usage:
  npm run research -- --input research/inputs/ats-rule-spec.yaml
  npm run research -- --input research/inputs/ats-rule-spec.yaml --dry-run
  npm run research -- --input research/inputs/ats-rule-spec.yaml --out output/research/ats-rule-spec
  npm run research -- --input research/inputs/ats-rule-spec.yaml --out output/research/ats-rule-spec --dry-run

Options:
  --input <path>  Input YAML file path.
  --out <dir>     Output directory override.
  --dry-run       Validate input and show planned search queries without API calls or file output.
  --help, -h      Show this help.

P0 unsupported options:
  --use-cache
  --json
  --run-report
  --chatgpt-prompt

M3 note:
  Normal execution calls Brave Search API for all generated queries sequentially.
  Search results are normalized and deduplicated by exact URL match.
  CSV/Markdown output is not generated yet.
`);
}

function parseCliArgs(argv: string[]): ResearchCliArgs {
  const args: ResearchCliArgs = {
    dryRun: false,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];

    if (current === undefined) {
      throw new CliArgumentError("Unexpected missing CLI argument");
    }

    switch (current) {
      case "--help":
      case "-h": {
        args.help = true;
        break;
      }

      case "--dry-run": {
        args.dryRun = true;
        break;
      }

      case "--input": {
        const value = argv[index + 1];

        if (!value || value.startsWith("--")) {
          throw new CliArgumentError("--input requires a file path");
        }

        args.input = value;
        index += 1;
        break;
      }

      case "--out": {
        const value = argv[index + 1];

        if (!value || value.startsWith("--")) {
          throw new CliArgumentError("--out requires a directory path");
        }

        args.out = assertSafeRelativePath(value, "--out");
        index += 1;
        break;
      }

      case "--use-cache":
      case "--json":
      case "--run-report":
      case "--chatgpt-prompt": {
        throw new CliArgumentError(`${current} is not supported in P0`);
      }

      default: {
        if (current.startsWith("--")) {
          throw new CliArgumentError(`Unknown option: ${current}`);
        }

        throw new CliArgumentError(`Unexpected argument: ${current}`);
      }
    }
  }

  if (!args.help && !args.input) {
    throw new CliArgumentError("--input is required");
  }

  return args;
}

function getEnabledArticleTypes(input: ResolvedResearchInput): string[] {
  const enabledTypes: string[] = [];

  if (input.articleType.devDiary) {
    enabledTypes.push("devDiary");
  }

  if (input.articleType.techArticle) {
    enabledTypes.push("techArticle");
  }

  if (input.articleType.paidNoteCandidate) {
    enabledTypes.push("paidNoteCandidate");
  }

  return enabledTypes;
}

function printDryRunResult(
  inputPath: string,
  resolvedInput: ResolvedResearchInput,
  queries: SearchQuery[],
): void {
  console.log("Research Memo Builder dry-run completed.");
  console.log("");
  console.log("Input");
  console.log(`  File: ${inputPath}`);
  console.log(`  Topic: ${resolvedInput.topic}`);
  console.log(
    `  Article types: ${getEnabledArticleTypes(resolvedInput).join(", ")}`,
  );
  console.log("");
  console.log("Search options");
  console.log(`  countPerQuery: ${resolvedInput.search.countPerQuery}`);
  console.log(`  country: ${resolvedInput.search.country}`);
  console.log(`  searchLang: ${resolvedInput.search.searchLang}`);
  console.log(`  uiLang: ${resolvedInput.search.uiLang}`);
  console.log(`  extraSnippets: ${resolvedInput.search.extraSnippets}`);
  console.log("");
  console.log("Output");
  console.log(`  Planned output dir: ${resolvedInput.output.dir}`);
  console.log("  CSV output: skipped in dry-run");
  console.log("  Markdown output: skipped in dry-run");
  console.log("");
  console.log("Planned requests");
  console.log(`  ${queries.length}`);
  console.log("");
  console.log("Generated queries");

  for (const [index, query] of queries.entries()) {
    console.log(
      `  ${index + 1}. [${query.platform.name}] ${query.query} ` +
        `(count=${query.count}, country=${query.country}, search_lang=${query.searchLang}, ui_lang=${query.uiLang}, extra_snippets=${query.extraSnippets})`,
    );
  }

  console.log("");
  console.log("No Brave Search API calls were made.");
  console.log("No CSV or Markdown files were written.");
}

function printResearchRunResult(result: RunResearchUseCaseResult): void {
  if (result.exitCode === ResearchExitCode.SUCCESS) {
    console.log("M3 search completed.");
  } else if (result.exitCode === ResearchExitCode.PARTIAL_API_FAILURE) {
    console.log("M3 search completed with partial API failures.");
  } else if (result.exitCode === ResearchExitCode.ALL_API_FAILURE) {
    console.log("M3 search failed because all API requests failed.");
  } else {
    console.log("M3 search completed with non-success exit code.");
  }

  console.log("");
  console.log("Search execution");
  console.log(`  Generated query count: ${result.queryCount}`);
  console.log(`  Executed query count: ${result.executedQueryCount}`);
  console.log(`  Succeeded query count: ${result.succeededQueryCount}`);
  console.log(`  Failed query count: ${result.failedQueryCount}`);
  console.log("");
  console.log("Results");
  console.log(`  Raw item count: ${result.rawResultCount}`);
  console.log(`  Normalized item count: ${result.normalizedResultCount}`);
  console.log(`  Deduplicated item count: ${result.deduplicatedResultCount}`);
  console.log(`  Removed duplicate count: ${result.removedDuplicateCount}`);
  console.log("");
  console.log("Output");
  console.log("  CSV/Markdown output is skipped in M3.");

  if (result.warnings.length > 0) {
    console.log("");
    console.log("Warnings");

    for (const warning of result.warnings) {
      console.log(`  - ${warning}`);
    }
  }
}

function printResearchFailures(result: RunResearchUseCaseResult): void {
  if (result.failures.length === 0) {
    return;
  }

  console.error("");
  console.error("Failed API requests");

  for (const [index, failure] of result.failures.entries()) {
    console.error(`  ${index + 1}. [${failure.platform}] ${failure.query}`);
    console.error(`     keyword: ${failure.keyword}`);
    console.error(`     type: ${failure.failureType}`);

    if (failure.httpStatus !== undefined) {
      console.error(`     HTTP status: ${failure.httpStatus}`);
    }

    console.error(`     message: ${failure.message}`);
  }
}

async function run(argv: string[]): Promise<ResearchExitCode> {
  const cliArgs = parseCliArgs(argv);

  if (cliArgs.help) {
    printHelp();
    return ResearchExitCode.SUCCESS;
  }

  const inputPath = cliArgs.input;

  if (!inputPath) {
    throw new CliArgumentError("--input is required");
  }

  const rawInput = await loadResearchInputFile(inputPath);
  const resolvedInput = validateAndResolveResearchInput(rawInput);

  const outputDir = cliArgs.out ?? resolvedInput.output.dir;
  const resolvedInputWithOutputOverride: ResolvedResearchInput = {
    ...resolvedInput,
    output: {
      ...resolvedInput.output,
      dir: assertSafeRelativePath(outputDir, "output.dir"),
    },
  };

  const queries = buildSearchQueries(resolvedInputWithOutputOverride);

  if (cliArgs.dryRun) {
    printDryRunResult(inputPath, resolvedInputWithOutputOverride, queries);
    return ResearchExitCode.SUCCESS;
  }

  const result = await runResearchUseCase(resolvedInputWithOutputOverride);

  printResearchRunResult(result);
  printResearchFailures(result);

  return result.exitCode;
}

function printInputError(error: Error): void {
  console.error("Input error");
  console.error(error.message);
}

function printConfigError(error: Error): void {
  console.error("Config error");
  console.error(error.message);
}

function printUnexpectedError(error: unknown): void {
  console.error("Unexpected error");

  if (error instanceof Error) {
    console.error(error.message);
    return;
  }

  console.error(String(error));
}

async function main(): Promise<void> {
  try {
    const exitCode = await run(process.argv.slice(2));
    process.exitCode = exitCode;
  } catch (error) {
    if (
      error instanceof CliArgumentError ||
      error instanceof ResearchInputLoadError ||
      error instanceof ResearchInputValidationError ||
      error instanceof UnsafePathError
    ) {
      printInputError(error);
      process.exitCode = ResearchExitCode.INPUT_ERROR;
      return;
    }

    if (error instanceof EnvConfigError) {
      printConfigError(error);
      process.exitCode = ResearchExitCode.CONFIG_ERROR;
      return;
    }

    printUnexpectedError(error);
    process.exitCode = ResearchExitCode.UNEXPECTED_ERROR;
  }
}

await main();
