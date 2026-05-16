import { useQuery } from "@tanstack/react-query";
import { ENV } from "@/shared/config/env";
import {
  getSuccessful,
  getSuccessfulProcessedTotal,
} from "../services/successfulService";
import type {
  SalesQuery,
  SuccessfulProcessedTotalQuery,
} from "../types/sale";

export const useSuccessful = (query: SalesQuery, enabled = true) =>
  useQuery({
    queryKey: ["successful-payments", "sales", query],
    queryFn: () => getSuccessful(query),
    enabled,
    retry: ENV.API_RETRY_LIMIT,
  });

export const useSuccessfulProcessedTotal = (
  query: SuccessfulProcessedTotalQuery,
  enabled = true,
) =>
  useQuery({
    queryKey: ["successful-payments", "processed-total", query],
    queryFn: () => getSuccessfulProcessedTotal(query),
    enabled,
    retry: ENV.API_RETRY_LIMIT,
  });
