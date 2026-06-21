import type { SearchPlatform } from "./searchPlatform.js";

export type SearchQuery = {
  keyword: string;
  platform: SearchPlatform;
  query: string;
  count: number;
  country: string;
  searchLang: string;
  uiLang: string;
  extraSnippets: boolean;
};
