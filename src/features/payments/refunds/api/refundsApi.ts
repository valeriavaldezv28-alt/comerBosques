import { apiClient } from "@/shared/api/apiClient";
import { API_ENDPOINTS } from "@/shared/api/apiConfig";
import type { RefundsApiResponse, RefundsQuery } from "../types/refund";

const buildRefundsEndpoint = (query: RefundsQuery): string => {
  const searchParams = new URLSearchParams();

  searchParams.set("size", String(query.size));
  searchParams.set("from", query.from);
  searchParams.set("to", query.to);
  if (query.cursor) {
    searchParams.set("cursor", query.cursor);
  }

  return `${API_ENDPOINTS.dashboard.refundTransactions}?${searchParams.toString()}`;
};

export const fetchRefunds = async (query: RefundsQuery): Promise<RefundsApiResponse> =>
  apiClient<RefundsApiResponse>(buildRefundsEndpoint(query));
