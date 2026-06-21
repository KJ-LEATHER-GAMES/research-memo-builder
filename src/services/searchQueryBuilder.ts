import type { ResolvedResearchInput } from "../domain/researchInput.js";
import type { SearchQuery } from "../domain/searchQuery.js";

export function buildSearchQueries(
  input: ResolvedResearchInput,
): SearchQuery[] {
  const queries: SearchQuery[] = [];

  for (const platform of input.platforms) {
    for (const keyword of input.keywords) {
      queries.push({
        keyword,
        platform,
        query: `site:${platform.site} ${keyword}`,
        count: input.search.countPerQuery,
        country: input.search.country,
        searchLang: input.search.searchLang,
        uiLang: input.search.uiLang,
        extraSnippets: input.search.extraSnippets,
      });
    }
  }

  return queries;
}
