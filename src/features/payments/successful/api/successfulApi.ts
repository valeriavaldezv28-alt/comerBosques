import { apiClient } from "@/shared/api/apiClient";
import { API_ENDPOINTS } from "@/shared/api/apiConfig";
import type {
  SalesApiResponse,
  SalesQuery,
  SuccessfulProcessedTotalApiResponse,
  SuccessfulProcessedTotalQuery,
} from "../types/sale";

const buildSuccessfulEndpoint = (query: SalesQuery, endpoint: string): string => {
  const searchParams = new URLSearchParams();

  if (query.size !== undefined) {searchParams.set("size", String(query.size));}
  if (query.cursor) {searchParams.set("cursor", query.cursor);}
  if (query.from) {searchParams.set("from", query.from);}
  if (query.to) {searchParams.set("to", query.to);}

  return `${endpoint}?${searchParams.toString()}`;
};

const buildProcessedTotalEndpoint = (
  query: SuccessfulProcessedTotalQuery,
): string => {
  const searchParams = new URLSearchParams();
  searchParams.set("from", query.from);
  searchParams.set("to", query.to);

  return `${API_ENDPOINTS.dashboard.processedTotal}?${searchParams.toString()}`;
};

export const fetchSuccessful = async (query: SalesQuery): Promise<SalesApiResponse> =>
  apiClient<SalesApiResponse>(
    buildSuccessfulEndpoint(query, API_ENDPOINTS.dashboard.roxTransactions),
  );

export const fetchSuccessfulProcessedTotal = async (
  query: SuccessfulProcessedTotalQuery,
): Promise<SuccessfulProcessedTotalApiResponse> =>
  apiClient<SuccessfulProcessedTotalApiResponse>(
    buildProcessedTotalEndpoint(query),
  );
