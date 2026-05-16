import { useQuery } from "@tanstack/react-query";
import { ENV } from "@/shared/config/env";
import { getTransactionSearch } from "../services/transactionSearchService";
import type { TransactionSearchQuery } from "../types/transactionSearch";

export const useTransactionSearch = (query: TransactionSearchQuery, enabled = true) =>
  useQuery({
    queryKey: ["payments", "transaction-search", query],
    queryFn: () => getTransactionSearch(query),
    enabled,
    retry: ENV.API_RETRY_LIMIT,
  });
