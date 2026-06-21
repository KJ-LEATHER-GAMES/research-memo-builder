import type {
  SearchQueryExecutionResult,
  SearchQueryFailure,
} from "../domain/searchExecution.js";
import type { SearchQuery } from "../domain/searchQuery.js";

const BRAVE_WEB_SEARCH_ENDPOINT =
  "https://api.search.brave.com/res/v1/web/search";

export type BraveSearchResultItem = {
  title?: string;
  url?: string;
  description?: string;
  extra_snippets?: string[];
};

type BraveWebSearchResponse = {
  web?: {
    results?: BraveSearchResultItem[];
  };
};

export type BraveSearchClientOptions = {
  apiKey: string;
  endpoint?: string;
};

export class BraveSearchClient {
  private readonly apiKey: string;
  private readonly endpoint: string;

  constructor(options: BraveSearchClientOptions) {
    this.apiKey = options.apiKey;
    this.endpoint = options.endpoint ?? BRAVE_WEB_SEARCH_ENDPOINT;
  }

  async search(
    query: SearchQuery,
  ): Promise<SearchQueryExecutionResult<BraveSearchResultItem>> {
    const retrievedAt = new Date().toISOString();

    try {
      const url = new URL(this.endpoint);

      url.searchParams.set("q", query.query);
      url.searchParams.set("count", String(query.count));
      url.searchParams.set("country", query.country);
      url.searchParams.set("search_lang", query.searchLang);
      url.searchParams.set("ui_lang", query.uiLang);
      url.searchParams.set("extra_snippets", String(query.extraSnippets));

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip",
          "X-Subscription-Token": this.apiKey,
        },
      });

      if (!response.ok) {
        const errorBody = await readSafeErrorBody(response);

        return {
          status: "failure",
          query,
          retrievedAt,
          failure: {
            type: "http_error",
            httpStatus: response.status,
            message:
              errorBody.length > 0
                ? `Brave Search API returned HTTP ${response.status}. Response body: ${errorBody}`
                : `Brave Search API returned HTTP ${response.status}.`,
          },
        };
      }

      const data = (await response.json()) as unknown;

      if (!isBraveWebSearchResponse(data)) {
        return {
          status: "failure",
          query,
          retrievedAt,
          failure: {
            type: "invalid_response",
            message: "Brave Search API response format is invalid.",
          },
        };
      }

      return {
        status: "success",
        query,
        retrievedAt,
        items: data.web?.results ?? [],
      };
    } catch (error) {
      return {
        status: "failure",
        query,
        retrievedAt,
        failure: toSearchQueryFailure(error),
      };
    }
  }
}

function isBraveWebSearchResponse(
  value: unknown,
): value is BraveWebSearchResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const response = value as {
    web?: {
      results?: unknown;
    };
  };

  if (response.web === undefined) {
    return true;
  }

  if (typeof response.web !== "object" || response.web === null) {
    return false;
  }

  if (response.web.results === undefined) {
    return true;
  }

  return Array.isArray(response.web.results);
}

function toSearchQueryFailure(error: unknown): SearchQueryFailure {
  if (error instanceof TypeError) {
    return {
      type: "network_error",
      message: "Network error occurred while calling Brave Search API.",
    };
  }

  if (error instanceof Error) {
    return {
      type: "unknown_error",
      message: error.message,
    };
  }

  return {
    type: "unknown_error",
    message: "Unknown error occurred while calling Brave Search API.",
  };
}

async function readSafeErrorBody(response: Response): Promise<string> {
  try {
    const text = await response.text();
    return sanitizeErrorBody(text);
  } catch {
    return "";
  }
}

function sanitizeErrorBody(text: string): string {
  return text.replace(/\s+/g, " ").trim().slice(0, 500);
}
