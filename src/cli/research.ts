import { access } from "node:fs/promises";
import path from "node:path";

const DEFAULT_INPUT = "research/inputs/ats-rule-spec.yaml";

type CliArgs = {
  input: string;
  out?: string;
  dryRun: boolean;
};

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    input: DEFAULT_INPUT,
    dryRun: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];

    if (current === "--input") {
      const next = argv[index + 1];
      if (!next) {
        throw new Error("--input requires a file path.");
      }
      args.input = next;
      index += 1;
      continue;
    }

    if (current === "--out") {
      const next = argv[index + 1];
      if (!next) {
        throw new Error("--out requires a directory path.");
      }
      args.out = next;
      index += 1;
      continue;
    }

    if (current === "--dry-run") {
      args.dryRun = true;
      continue;
    }

    if (current === "--help" || current === "-h") {
      printHelp();
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${current}`);
  }

  return args;
}

function printHelp(): void {
  console.log(`Research Memo Builder

Usage:
  npm run research -- --input research/inputs/ats-rule-spec.yaml
  npm run research -- --input research/inputs/ats-rule-spec.yaml --out output/research/ats-rule-spec
  npm run research -- --input research/inputs/ats-rule-spec.yaml --dry-run

Options:
  --input <path>  Input YAML file path. Default: ${DEFAULT_INPUT}
  --out <dir>     Output directory override.
  --dry-run       Do not call external APIs. Intended for query generation in later milestones.
  --help, -h      Show this help.
`);
}

async function assertFileExists(filePath: string): Promise<void> {
  try {
    await access(filePath);
  } catch {
    throw new Error(`Input file was not found: ${filePath}`);
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const inputPath = path.resolve(process.cwd(), args.input);

  await assertFileExists(inputPath);

  console.log("Research Memo Builder CLI scaffold is ready.");
  console.log(`Input: ${args.input}`);
  console.log(`Output override: ${args.out ?? "<from input YAML>"}`);
  console.log(`Dry run: ${args.dryRun ? "true" : "false"}`);
  console.log("Next milestone: implement .env loading, YAML parsing, validation, and query generation.");
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`ERROR: ${message}`);
  process.exit(1);
});
