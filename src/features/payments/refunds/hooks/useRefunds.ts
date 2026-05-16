import { useQuery } from "@tanstack/react-query";
import { ENV } from "@/shared/config/env";
import { getRefunds } from "../services/refundsService";
import type { RefundsQuery } from "../types/refund";

export const useRefunds = (query: RefundsQuery, enabled = true) =>
  useQuery({
    queryKey: ["successful-payments", "refunds", query],
    queryFn: () => getRefunds(query),
    enabled,
    retry: ENV.API_RETRY_LIMIT,
  });
