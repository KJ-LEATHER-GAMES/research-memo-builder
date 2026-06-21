export type NormalizedSearchResult = {
  keyword: string;
  platform: string;
  query: string;
  rank: number;
  title: string;
  url: string;
  snippet: string;
  extraSnippets: string[];
  retrievedAt: string;
};
