import { z } from "zod";

import type { ResolvedResearchInput } from "../domain/researchInput.js";
import { isSafeRelativePath } from "../utils/safePath.js";

export class ResearchInputValidationError extends Error {
  constructor(public readonly issues: string[]) {
    super(["Research input validation failed.", ...issues].join("\n"));
    this.name = "ResearchInputValidationError";
  }
}

const nonEmptyTrimmedString = z
  .string({
    error: "must be a string",
  })
  .transform((value) => value.trim())
  .refine((value) => value.length > 0, {
    message: "must not be empty",
  });

const domainString = nonEmptyTrimmedString
  .transform((value) => value.toLowerCase())
  .refine((value) => !value.startsWith("http://"), {
    message: "must be a domain only. Do not include 'http://'",
  })
  .refine((value) => !value.startsWith("https://"), {
    message: "must be a domain only. Do not include 'https://'",
  })
  .refine((value) => !value.includes("/"), {
    message: "must be a domain only. Do not include paths",
  })
  .refine(
    (value) =>
      /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/.test(
        value,
      ),
    {
      message:
        "must be a valid domain such as note.com, qiita.com, or zenn.dev",
    },
  );

const articleTypeSchema = z
  .object({
    devDiary: z.boolean({
      error: "articleType.devDiary must be boolean",
    }),
    techArticle: z.boolean({
      error: "articleType.techArticle must be boolean",
    }),
    paidNoteCandidate: z.boolean({
      error: "articleType.paidNoteCandidate must be boolean",
    }),
  })
  .strict()
  .superRefine((value, context) => {
    if (!value.devDiary && !value.techArticle && !value.paidNoteCandidate) {
      context.addIssue({
        code: "custom",
        message:
          "at least one of articleType.devDiary, articleType.techArticle, or articleType.paidNoteCandidate must be true",
        path: ["articleType"],
      });
    }
  });

const searchPlatformSchema = z
  .object({
    name: nonEmptyTrimmedString,
    site: domainString,
  })
  .strict();

const searchOptionsBodySchema = z
  .object({
    countPerQuery: z
      .number({
        error: "search.countPerQuery must be a number",
      })
      .int("search.countPerQuery must be an integer")
      .min(1, "search.countPerQuery must be at least 1")
      .max(20, "search.countPerQuery must be 20 or less")
      .default(10),
    country: nonEmptyTrimmedString.default("JP"),
    searchLang: nonEmptyTrimmedString.default("jp"),
    uiLang: nonEmptyTrimmedString.default("ja-JP"),
    extraSnippets: z
      .boolean({
        error: "search.extraSnippets must be boolean",
      })
      .default(true),
  })
  .strict();

const searchOptionsSchema = z.preprocess(
  (value) => value ?? {},
  searchOptionsBodySchema,
);

const outputOptionsSchema = z
  .object({
    dir: nonEmptyTrimmedString.refine((value) => isSafeRelativePath(value), {
      message:
        "output.dir must be a relative path. Absolute paths and '../' are not allowed",
    }),
    csv: z
      .boolean({
        error: "output.csv must be boolean",
      })
      .default(true)
      .refine((value) => value === true, {
        message: "output.csv must be true in P0",
      }),
    markdownMemo: z
      .boolean({
        error: "output.markdownMemo must be boolean",
      })
      .default(true)
      .refine((value) => value === true, {
        message: "output.markdownMemo must be true in P0",
      }),
    json: z
      .boolean({
        error: "output.json must be boolean",
      })
      .default(false)
      .refine((value) => value === false, {
        message: "output.json must be false in P0",
      }),
    runReport: z
      .boolean({
        error: "output.runReport must be boolean",
      })
      .default(false)
      .refine((value) => value === false, {
        message: "output.runReport must be false in P0",
      }),
    chatgptPrompt: z
      .boolean({
        error: "output.chatgptPrompt must be boolean",
      })
      .default(false)
      .refine((value) => value === false, {
        message: "output.chatgptPrompt must be false in P0",
      }),
  })
  .strict();

export const researchInputSchema = z
  .object({
    topic: nonEmptyTrimmedString,
    articleType: articleTypeSchema,
    keywords: z
      .array(nonEmptyTrimmedString, {
        error: "keywords must be an array of strings",
      })
      .min(1, "keywords must contain at least 1 item")
      .max(5, "keywords must contain 5 items or less")
      .transform((keywords) => Array.from(new Set(keywords))),
    platforms: z
      .array(searchPlatformSchema, {
        error: "platforms must be an array",
      })
      .min(1, "platforms must contain at least 1 item")
      .max(3, "platforms must contain 3 items or less")
      .superRefine((platforms, context) => {
        const seenSites = new Set<string>();

        for (const [index, platform] of platforms.entries()) {
          if (seenSites.has(platform.site)) {
            context.addIssue({
              code: "custom",
              path: [index, "site"],
              message: `platforms[].site must be unique. Duplicated site: ${platform.site}`,
            });
          }

          seenSites.add(platform.site);
        }
      }),
    search: searchOptionsSchema,
    output: outputOptionsSchema,
  })
  .strict();

export function validateAndResolveResearchInput(
  raw: unknown,
): ResolvedResearchInput {
  const result = researchInputSchema.safeParse(raw);

  if (!result.success) {
    const issues = result.error.issues.map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "<root>";
      return `- ${path}: ${issue.message}`;
    });

    throw new ResearchInputValidationError(issues);
  }

  return result.data satisfies ResolvedResearchInput;
}
