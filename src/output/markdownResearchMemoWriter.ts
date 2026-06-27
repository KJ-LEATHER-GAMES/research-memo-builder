import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  renderMarkdownResearchMemo,
  type ResearchMemoRenderInput,
} from "../renderers/markdownResearchMemoRenderer.js";

export const MARKDOWN_RESEARCH_MEMO_FILENAME = "research-memo.md";

export class MarkdownResearchMemoWriteError extends Error {
  constructor(
    message: string,
    public readonly filePath: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "MarkdownResearchMemoWriteError";
  }
}

export type WriteMarkdownResearchMemoParams = ResearchMemoRenderInput;

export async function writeMarkdownResearchMemo(
  params: WriteMarkdownResearchMemoParams,
): Promise<string> {
  const filePath = path.join(params.outputDir, MARKDOWN_RESEARCH_MEMO_FILENAME);
  const markdown = renderMarkdownResearchMemo(params);

  try {
    await mkdir(params.outputDir, { recursive: true });
    await writeFile(filePath, markdown, "utf8");
  } catch (error) {
    throw new MarkdownResearchMemoWriteError(
      `Failed to write Markdown output: ${filePath}`,
      filePath,
      { cause: error },
    );
  }

  return filePath;
}
