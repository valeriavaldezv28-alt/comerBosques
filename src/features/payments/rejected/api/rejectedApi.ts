import { apiClient } from "@/shared/api/apiClient";
import { API_ENDPOINTS } from "@/shared/api/apiConfig";
import type { GmvErrorsApiResponse, GmvErrorsQuery } from "../types/gmvError";

const buildRejectedEndpoint = (query: GmvErrorsQuery): string => {
  const searchParams = new URLSearchParams();
  searchParams.set("size", String(query.size));
  if (query.from) {
    searchParams.set("from", query.from);
  }
  if (query.to) {
    searchParams.set("to", query.to);
  }
  if (query.cursor) {
    searchParams.set("cursor", query.cursor);
  }
  if (query.page !== undefined) {
    searchParams.set("page", String(query.page));
  }
  return `${API_ENDPOINTS.dashboard.errorResponses}?${searchParams.toString()}`;
};

export const fetchRejected = async (query: GmvErrorsQuery): Promise<GmvErrorsApiResponse> =>
  apiClient<GmvErrorsApiResponse>(buildRejectedEndpoint(query));
