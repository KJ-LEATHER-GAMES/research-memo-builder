import { readFile } from "node:fs/promises";
import { parse } from "yaml";

export class ResearchInputLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ResearchInputLoadError";
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function getNodeErrorCode(error: unknown): string | undefined {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return error.code;
  }

  return undefined;
}

export async function loadResearchInputFile(
  inputPath: string,
): Promise<unknown> {
  let yamlText: string;

  try {
    yamlText = await readFile(inputPath, "utf8");
  } catch (error) {
    const code = getNodeErrorCode(error);

    if (code === "ENOENT") {
      throw new ResearchInputLoadError(
        `Input YAML file was not found: ${inputPath}`,
      );
    }

    throw new ResearchInputLoadError(
      `Failed to read input YAML file: ${inputPath}. ${getErrorMessage(error)}`,
    );
  }

  try {
    return parse(yamlText);
  } catch (error) {
    throw new ResearchInputLoadError(
      `Failed to parse YAML file: ${inputPath}. ${getErrorMessage(error)}`,
    );
  }
}
