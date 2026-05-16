import { apiClient } from "@/shared/api/apiClient";
import { API_ENDPOINTS } from "@/shared/api/apiConfig";
import type { TransactionSearchApiResponse, TransactionSearchQuery } from "../types/transactionSearch";

const buildTransactionSearchEndpoint = (query: TransactionSearchQuery): string => {
  const searchParams = new URLSearchParams();

  if (query.transactionId) {
    searchParams.set("transactionId", query.transactionId);
  }

  if (query.orderId) {
    searchParams.set("orderId", query.orderId);
  }

  searchParams.set("from", query.from);
  searchParams.set("to", query.to);
  searchParams.set("size", String(query.size));

  if (query.cursor) {
    searchParams.set("cursor", query.cursor);
  }

  return `${API_ENDPOINTS.dashboard.roxTransactions}?${searchParams.toString()}`;
};

export const fetchTransactionSearch = async (
  query: TransactionSearchQuery,
): Promise<TransactionSearchApiResponse> =>
  apiClient<TransactionSearchApiResponse>(buildTransactionSearchEndpoint(query));
