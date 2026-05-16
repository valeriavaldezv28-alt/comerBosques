import { useQuery } from "@tanstack/react-query";
import { ENV } from "@/shared/config/env";
import { getIntents } from "../services/intentsService";
import type { PaymentIntentsQuery } from "../types/paymentIntent";

export const useIntents = (query: PaymentIntentsQuery, enabled = true) =>
  useQuery({
    queryKey: ["payment-intents", query],
    queryFn: () => getIntents(query),
    enabled,
    retry: ENV.API_RETRY_LIMIT,
  });
