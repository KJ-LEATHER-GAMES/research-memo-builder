import type { SearchQuery } from "./searchQuery.js";

export type SearchQueryFailureType =
  | "http_error"
  | "network_error"
  | "invalid_response"
  | "unknown_error";

export type SearchQueryFailure = {
  type: SearchQueryFailureType;
  httpStatus?: number;
  message: string;
};

export type SearchQueryExecutionResult<TItem> =
  | {
      status: "success";
      query: SearchQuery;
      items: TItem[];
      retrievedAt: string;
    }
  | {
      status: "failure";
      query: SearchQuery;
      failure: SearchQueryFailure;
      retrievedAt: string;
    };
