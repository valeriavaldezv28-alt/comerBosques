import {
  fetchSuccessful,
  fetchSuccessfulProcessedTotal,
} from "../api/successfulApi";
import {
  mapSuccessful,
  mapSuccessfulProcessedTotal,
} from "../mappers/successfulMapper";
import type {
  Sales,
  SalesQuery,
  SuccessfulProcessedTotal,
  SuccessfulProcessedTotalQuery,
} from "../types/sale";

export const getSuccessful = async (query: SalesQuery): Promise<Sales> => {
  const payload = await fetchSuccessful(query);
  return mapSuccessful(payload);
};

export const getSuccessfulProcessedTotal = async (
  query: SuccessfulProcessedTotalQuery,
): Promise<SuccessfulProcessedTotal> => {
  const payload = await fetchSuccessfulProcessedTotal(query);
  return mapSuccessfulProcessedTotal(payload);
};
