import type { OutputOptions } from "./outputOptions.js";
import type { SearchOptions } from "./searchOptions.js";
import type { SearchPlatform } from "./searchPlatform.js";

export type RawResearchInput = {
  topic?: unknown;
  articleType?: unknown;
  keywords?: unknown;
  platforms?: unknown;
  search?: unknown;
  output?: unknown;
};

export type ArticleType = {
  devDiary: boolean;
  techArticle: boolean;
  paidNoteCandidate: boolean;
};

export type ResolvedResearchInput = {
  topic: string;
  articleType: ArticleType;
  keywords: string[];
  platforms: SearchPlatform[];
  search: SearchOptions;
  output: OutputOptions;
};
