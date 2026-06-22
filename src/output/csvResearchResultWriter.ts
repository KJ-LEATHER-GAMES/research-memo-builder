import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { NormalizedSearchResult } from "../domain/normalizedSearchResult.js";
import { renderSearchResultsCsv } from "../renderers/csvRenderer.js";

export const CSV_SEARCH_RESULTS_FILENAME = "search-results.csv";
const UTF8_BOM = "\uFEFF";

export class CsvResearchResultWriteError extends Error {
  constructor(
    message: string,
    public readonly filePath: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "CsvResearchResultWriteError";
  }
}

export type WriteCsvResearchResultsParams = {
  outputDir: string;
  results: NormalizedSearchResult[];
};

export async function writeCsvResearchResults(
  params: WriteCsvResearchResultsParams,
): Promise<string> {
  const filePath = path.join(params.outputDir, CSV_SEARCH_RESULTS_FILENAME);
  const csv = `${UTF8_BOM}${renderSearchResultsCsv(params.results)}`;

  try {
    await mkdir(params.outputDir, { recursive: true });
    await writeFile(filePath, csv, "utf8");
  } catch (error) {
    throw new CsvResearchResultWriteError(
      `Failed to write CSV output: ${filePath}`,
      filePath,
      { cause: error },
    );
  }

  return filePath;
}
