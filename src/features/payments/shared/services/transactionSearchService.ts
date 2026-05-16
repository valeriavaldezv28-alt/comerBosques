import { fetchTransactionSearch } from "../api/transactionSearchApi";
import { mapTransactionSearch } from "../mappers/transactionSearchMapper";
import type { TransactionSearchQuery, TransactionSearchResult } from "../types/transactionSearch";

export const getTransactionSearch = async (
  query: TransactionSearchQuery,
): Promise<TransactionSearchResult> => {
  const payload = await fetchTransactionSearch(query);
  return mapTransactionSearch(payload);
};
