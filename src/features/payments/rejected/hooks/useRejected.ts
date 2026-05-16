import { useQuery } from "@tanstack/react-query";
import { ENV } from "@/shared/config/env";
import { getRejected } from "../services/rejectedService";
import type { GmvErrorsQuery } from "../types/gmvError";

export const useRejected = (query: GmvErrorsQuery, enabled = true) =>
  useQuery({
    queryKey: ["payment-attempts", "rejected-transactions", query],
    queryFn: () => getRejected(query),
    enabled,
    retry: ENV.API_RETRY_LIMIT,
  });
